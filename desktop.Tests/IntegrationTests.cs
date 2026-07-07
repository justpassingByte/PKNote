using System.Drawing;

namespace PokerHUD.Tests;

/// <summary>
/// Integration tests: cross-component flows testing
/// SeatEngine → OCR → StateStore, and ApiClient batching.
/// </summary>
public class IntegrationTests
{
    /// <summary>
    /// Verifies end-to-end: SeatEngine events wire to StateStore correctly.
    /// Simulates a seat join → OCR extraction → state update flow.
    /// </summary>
    [Fact]
    public void SeatJoinToStateUpdate_EndToEnd()
    {
        var store = new StateStore();
        store.TryAddTable(new IntPtr(1), "Table 1", "default");

        // Simulate what SeatEngine does on seat join
        store.UpdateSeat(new IntPtr(1), 1, s =>
        {
            s.Status = Occupancy.Occupied;
            s.PlayerName = "VisionPlayer";
            s.LastValidName = "VisionPlayer";
            s.OcrConfidence = 0.85f;
            s.OcrFailed = false;
            s.LastSeenTimestamp = DateTime.UtcNow;
        });

        // Simulate API returning stats
        store.UpdateSeat(new IntPtr(1), 1, s =>
        {
            s.Stats = new PlayerStats
            {
                PlayerId = "VisionPlayer",
                Vpip = 25.0,
                Pfr = 18.0,
                Af = 2.1,
                TotalHands = 500
            };
        });

        var seat = store.GetTable(new IntPtr(1))!.Seats[1];
        Assert.Equal(Occupancy.Occupied, seat.Status);
        Assert.Equal("VisionPlayer", seat.PlayerName);
        Assert.NotNull(seat.Stats);
        Assert.Equal(25.0, seat.Stats!.Vpip);
        Assert.Equal(500, seat.Stats.TotalHands);
    }

    /// <summary>
    /// Verifies seat leave cleanup flow.
    /// </summary>
    [Fact]
    public void SeatLeave_ClearsPlayerButKeepsLastValid()
    {
        var store = new StateStore();
        store.TryAddTable(new IntPtr(1), "Table 1", "default");

        // Player sits down
        store.UpdateSeat(new IntPtr(1), 1, s =>
        {
            s.Status = Occupancy.Occupied;
            s.PlayerName = "Alice";
            s.LastValidName = "Alice";
        });

        // Player leaves (SeatEngine clears name but keeps LastValidName)
        store.UpdateSeat(new IntPtr(1), 1, s =>
        {
            s.Status = Occupancy.Empty;
            s.PlayerName = string.Empty;
            s.Stats = null;
            s.OcrFailed = false;
        });

        var seat = store.GetTable(new IntPtr(1))!.Seats[1];
        Assert.Equal(Occupancy.Empty, seat.Status);
        Assert.Equal(string.Empty, seat.PlayerName);
        Assert.Equal("Alice", seat.LastValidName); // Preserved for seat locking
        Assert.Null(seat.Stats);
    }

    /// <summary>
    /// OCR fail → seat locking → preserves LastValidName.
    /// </summary>
    [Fact]
    public void OcrFail_SeatLocking_PreservesLastValidName()
    {
        var store = new StateStore();
        store.TryAddTable(new IntPtr(1), "Table 1", "default");

        // First OCR succeeds
        store.UpdateSeat(new IntPtr(1), 1, s =>
        {
            s.PlayerName = "CorrectName";
            s.LastValidName = "CorrectName";
            s.OcrFailed = false;
        });

        // Re-OCR fails → seat locking activates
        store.UpdateSeat(new IntPtr(1), 1, s =>
        {
            s.OcrFailed = true;
            // SeatEngine logic: keep LastValidName if OCR fails
            if (!string.IsNullOrEmpty(s.LastValidName))
                s.PlayerName = s.LastValidName;
        });

        var seat = store.GetTable(new IntPtr(1))!.Seats[1];
        Assert.True(seat.OcrFailed);
        Assert.Equal("CorrectName", seat.PlayerName); // Locked to LastValidName
        Assert.Equal("CorrectName", seat.LastValidName);
    }

    /// <summary>
    /// Manual name override → clears OcrFailed + sets ManualOverride.
    /// </summary>
    [Fact]
    public void ManualOverride_ClearsOcrFailed()
    {
        var store = new StateStore();
        store.TryAddTable(new IntPtr(1), "Table 1", "default");

        // OCR failed
        store.UpdateSeat(new IntPtr(1), 1, s =>
        {
            s.OcrFailed = true;
            s.PlayerName = "";
        });

        // User manually enters name
        store.UpdateSeat(new IntPtr(1), 1, s =>
        {
            s.PlayerName = "ManualName";
            s.LastValidName = "ManualName";
            s.ManualOverride = true;
            s.OcrFailed = false;
        });

        var seat = store.GetTable(new IntPtr(1))!.Seats[1];
        Assert.Equal("ManualName", seat.PlayerName);
        Assert.True(seat.ManualOverride);
        Assert.False(seat.OcrFailed);
    }

    /// <summary>
    /// Multi-table isolation: updating table 1 doesn't affect table 2.
    /// </summary>
    [Fact]
    public void MultiTable_StateIsolation()
    {
        var store = new StateStore();
        store.TryAddTable(new IntPtr(1), "Table 1", "default");
        store.TryAddTable(new IntPtr(2), "Table 2", "default");

        store.UpdateSeat(new IntPtr(1), 1, s => s.PlayerName = "Table1Player");
        store.UpdateSeat(new IntPtr(2), 1, s => s.PlayerName = "Table2Player");

        Assert.Equal("Table1Player", store.GetTable(new IntPtr(1))!.Seats[1].PlayerName);
        Assert.Equal("Table2Player", store.GetTable(new IntPtr(2))!.Seats[1].PlayerName);
    }

    /// <summary>
    /// Action pipeline: EventNormalizer → ActionEngine → StateStore
    /// </summary>
    [Fact]
    public void ActionPipeline_FullFlow()
    {
        var store = new StateStore();
        var apiClient = new ApiClient("http://fake.test:9999/api");
        var engine = new ActionEngine(store, apiClient);

        store.TryAddTable(new IntPtr(1), "T1", "p1");
        store.UpdateSeat(new IntPtr(1), 1, s =>
        {
            s.PlayerName = "TestPlayer";
            s.Stats = new PlayerStats
            {
                PlayerId = "TestPlayer",
                Vpip = 22, Pfr = 16, Af = 1.5, TotalHands = 200
            };
        });

        // Manual click: +CBet
        var action = EventNormalizer.FromManualClick("TestPlayer", ActionType.CBet, "flop");
        engine.ProcessAction(new IntPtr(1), 1, action);

        var seat = store.GetTable(new IntPtr(1))!.Seats[1];
        Assert.Equal(201, seat.Stats!.TotalHands);
        Assert.True(seat.Stats.Af > 1.5);
    }

    /// <summary>
    /// OCR preprocessor produces valid output (doesn't crash on small bitmaps).
    /// </summary>
    [Fact]
    public void OcrPreprocessor_SmallBitmap_DoesNotCrash()
    {
        using var small = new Bitmap(20, 10);
        using var result = OcrPreprocessor.Preprocess(small, 1.5f);

        Assert.NotNull(result);
        Assert.Equal(30, result.Width);   // 20 * 1.5
        Assert.Equal(15, result.Height);  // 10 * 1.5
    }

    /// <summary>
    /// StubOcrService returns valid result.
    /// </summary>
    [Fact]
    public async Task StubOcrService_ReturnsValidResult()
    {
        var ocr = new StubOcrService();
        using var bmp = new Bitmap(100, 50);

        var result = await ocr.RecognizeAsync(bmp);

        Assert.NotNull(result);
        Assert.False(result.IsEmpty);
        Assert.True(result.Confidence > 0);
        Assert.True(result.ShouldAccept); // Stub returns 0.75 confidence
    }
}
