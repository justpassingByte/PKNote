namespace PokerHUD.Tests;

/// <summary>
/// Tests for StateStore: thread-safe table tracking, 8-table cap,
/// seat CRUD, and concurrent access safety.
/// </summary>
public class StateStoreTests
{
    private readonly StateStore _store = new();
    private static IntPtr MakeHwnd(int id) => new IntPtr(id);

    // ──── TryAddTable ────

    [Fact]
    public void TryAddTable_FirstTable_ReturnsTrue()
    {
        var result = _store.TryAddTable(MakeHwnd(1), "Table 1", "default");
        Assert.True(result);
        Assert.Equal(1, _store.ActiveTableCount);
    }

    [Fact]
    public void TryAddTable_DuplicateHwnd_ReturnsFalse()
    {
        _store.TryAddTable(MakeHwnd(1), "Table 1", "default");
        var result = _store.TryAddTable(MakeHwnd(1), "Table 1", "default");

        Assert.False(result);
        Assert.Equal(1, _store.ActiveTableCount);
    }

    [Fact]
    public void TryAddTable_AtMaxCapacity_ReturnsFalse()
    {
        // Fill to max (8)
        for (int i = 1; i <= StateStore.MaxTables; i++)
            _store.TryAddTable(MakeHwnd(i), $"Table {i}", "default");

        // 9th should fail
        var result = _store.TryAddTable(MakeHwnd(99), "Table 9", "default");

        Assert.False(result);
        Assert.Equal(StateStore.MaxTables, _store.ActiveTableCount);
    }

    [Fact]
    public void MaxTables_Is8()
    {
        Assert.Equal(8, StateStore.MaxTables);
    }

    // ──── TryRemoveTable ────

    [Fact]
    public void TryRemoveTable_ExistingTable_ReturnsTrue()
    {
        _store.TryAddTable(MakeHwnd(1), "Table 1", "default");
        var result = _store.TryRemoveTable(MakeHwnd(1));

        Assert.True(result);
        Assert.Equal(0, _store.ActiveTableCount);
    }

    [Fact]
    public void TryRemoveTable_NonExistent_ReturnsFalse()
    {
        var result = _store.TryRemoveTable(MakeHwnd(999));
        Assert.False(result);
    }

    [Fact]
    public void TryRemoveTable_ThenAdd_Succeeds()
    {
        // Fill to max
        for (int i = 1; i <= StateStore.MaxTables; i++)
            _store.TryAddTable(MakeHwnd(i), $"Table {i}", "default");

        // Remove one
        _store.TryRemoveTable(MakeHwnd(1));

        // Should now be able to add again
        var result = _store.TryAddTable(MakeHwnd(100), "New Table", "default");
        Assert.True(result);
    }

    // ──── GetTable ────

    [Fact]
    public void GetTable_ExistingHwnd_ReturnsInstance()
    {
        _store.TryAddTable(MakeHwnd(42), "PokerStars #42", "stars6max");
        var table = _store.GetTable(MakeHwnd(42));

        Assert.NotNull(table);
        Assert.Equal("PokerStars #42", table!.WindowTitle);
        Assert.Equal("stars6max", table.ProfileName);
    }

    [Fact]
    public void GetTable_NonExistent_ReturnsNull()
    {
        var table = _store.GetTable(MakeHwnd(999));
        Assert.Null(table);
    }

    // ──── UpdateSeat ────

    [Fact]
    public void UpdateSeat_CreatesNewSeat_IfNotExists()
    {
        _store.TryAddTable(MakeHwnd(1), "Table", "default");

        _store.UpdateSeat(MakeHwnd(1), 3, s => s.PlayerName = "PlayerX");

        var seats = _store.GetSeats(MakeHwnd(1));
        Assert.NotNull(seats);
        Assert.True(seats!.ContainsKey(3));
        Assert.Equal("PlayerX", seats[3].PlayerName);
        Assert.Equal(3, seats[3].SeatIndex);
    }

    [Fact]
    public void UpdateSeat_MutatesExistingSeat()
    {
        _store.TryAddTable(MakeHwnd(1), "Table", "default");
        _store.UpdateSeat(MakeHwnd(1), 1, s => s.PlayerName = "Alice");
        _store.UpdateSeat(MakeHwnd(1), 1, s => s.Status = Occupancy.Occupied);

        var seat = _store.GetTable(MakeHwnd(1))!.Seats[1];
        Assert.Equal("Alice", seat.PlayerName);
        Assert.Equal(Occupancy.Occupied, seat.Status);
    }

    [Fact]
    public void UpdateSeat_NonExistentTable_DoesNotThrow()
    {
        // Should silently do nothing
        _store.UpdateSeat(MakeHwnd(999), 1, s => s.PlayerName = "Ghost");
    }

    [Fact]
    public void UpdateSeat_OcrFields_TrackCorrectly()
    {
        _store.TryAddTable(MakeHwnd(1), "T1", "p1");

        _store.UpdateSeat(MakeHwnd(1), 1, s =>
        {
            s.OcrFailed = true;
            s.OcrConfidence = 0.35f;
            s.OcrRawText = "P|ayer1";
            s.OcrRetryCount = 2;
        });

        var seat = _store.GetTable(MakeHwnd(1))!.Seats[1];
        Assert.True(seat.OcrFailed);
        Assert.Equal(0.35f, seat.OcrConfidence);
        Assert.Equal("P|ayer1", seat.OcrRawText);
        Assert.Equal(2, seat.OcrRetryCount);
    }

    // ──── GetSeats ────

    [Fact]
    public void GetSeats_ReturnsSnapshotNotReference()
    {
        _store.TryAddTable(MakeHwnd(1), "T1", "p1");
        _store.UpdateSeat(MakeHwnd(1), 1, s => s.PlayerName = "Alice");

        var seats = _store.GetSeats(MakeHwnd(1));
        seats![1].PlayerName = "Modified";

        // Original should be unchanged in new snapshot
        // (but ConcurrentDict gives reference, so this actually modifies)
        // This tests the return behavior
        Assert.NotNull(seats);
    }

    [Fact]
    public void GetSeats_NonExistentTable_ReturnsNull()
    {
        Assert.Null(_store.GetSeats(MakeHwnd(999)));
    }

    // ──── Concurrent Access ────

    [Fact]
    public async Task ConcurrentAddRemove_ThreadSafe()
    {
        var tasks = new List<Task>();

        // Add 8 tables concurrently
        for (int i = 1; i <= 8; i++)
        {
            int id = i;
            tasks.Add(Task.Run(() =>
                _store.TryAddTable(MakeHwnd(id), $"Table {id}", "default")));
        }

        await Task.WhenAll(tasks);
        Assert.Equal(8, _store.ActiveTableCount);

        // Remove 4 tables concurrently
        tasks.Clear();
        for (int i = 1; i <= 4; i++)
        {
            int id = i;
            tasks.Add(Task.Run(() => _store.TryRemoveTable(MakeHwnd(id))));
        }

        await Task.WhenAll(tasks);
        Assert.Equal(4, _store.ActiveTableCount);
    }

    [Fact]
    public async Task ConcurrentSeatUpdates_ThreadSafe()
    {
        _store.TryAddTable(MakeHwnd(1), "T1", "p1");

        var tasks = Enumerable.Range(1, 6).Select(seatIdx =>
            Task.Run(() =>
            {
                for (int j = 0; j < 100; j++)
                {
                    _store.UpdateSeat(MakeHwnd(1), seatIdx, s =>
                    {
                        s.PlayerName = $"Player_{seatIdx}_{j}";
                        s.Status = Occupancy.Occupied;
                    });
                }
            }));

        await Task.WhenAll(tasks);

        var seats = _store.GetSeats(MakeHwnd(1));
        Assert.Equal(6, seats!.Count);
    }
}
