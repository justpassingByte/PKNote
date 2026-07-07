namespace PokerHUD.Tests;

/// <summary>
/// Tests for EventNormalizer and ActionEngine.
/// Verifies manual vs vision source tagging and optimistic state updates.
/// </summary>
public class ActionEngineTests
{
    // ──── EventNormalizer ────

    [Fact]
    public void FromManualClick_SetsSourceToManual()
    {
        var action = EventNormalizer.FromManualClick("player1", ActionType.CBet, "flop", "vs1");

        Assert.Equal("player1", action.PlayerId);
        Assert.Equal(ActionType.CBet, action.Type);
        Assert.Equal("flop", action.Street);
        Assert.Equal("vs1", action.Context);
        Assert.Equal("manual", action.Source);
    }

    [Fact]
    public void FromVision_SetsSourceToVision()
    {
        var action = EventNormalizer.FromVision("player2", ActionType.ThreeBet, "preflop", "multiway");

        Assert.Equal("player2", action.PlayerId);
        Assert.Equal(ActionType.ThreeBet, action.Type);
        Assert.Equal("preflop", action.Street);
        Assert.Equal("multiway", action.Context);
        Assert.Equal("vision", action.Source);
    }

    [Fact]
    public void FromManualClick_DefaultValues()
    {
        var action = EventNormalizer.FromManualClick("p1", ActionType.Call);

        Assert.Equal("preflop", action.Street);
        Assert.Equal("vs1", action.Context);
    }

    // ──── ActionEngine Optimistic Updates ────

    [Fact]
    public void ProcessAction_CBet_IncrementsAf()
    {
        var store = new StateStore();
        var apiClient = new ApiClient("http://fake.test:9999/api");
        var engine = new ActionEngine(store, apiClient);

        store.TryAddTable(new IntPtr(1), "T1", "p1");
        store.UpdateSeat(new IntPtr(1), 1, s =>
        {
            s.PlayerName = "Alice";
            s.Stats = new PlayerStats { PlayerId = "Alice", Vpip = 20, Pfr = 15, Af = 1.0, TotalHands = 100 };
        });

        var action = EventNormalizer.FromManualClick("Alice", ActionType.CBet);
        engine.ProcessAction(new IntPtr(1), 1, action);

        var seat = store.GetTable(new IntPtr(1))!.Seats[1];
        Assert.True(seat.Stats!.Af > 1.0); // AF should have increased
        Assert.Equal(101, seat.Stats.TotalHands); // TotalHands incremented
    }

    [Fact]
    public void ProcessAction_Call_IncrementsVpip()
    {
        var store = new StateStore();
        var apiClient = new ApiClient("http://fake.test:9999/api");
        var engine = new ActionEngine(store, apiClient);

        store.TryAddTable(new IntPtr(1), "T1", "p1");
        store.UpdateSeat(new IntPtr(1), 1, s =>
        {
            s.PlayerName = "Bob";
            s.Stats = new PlayerStats { PlayerId = "Bob", Vpip = 25, Pfr = 10, Af = 0.8, TotalHands = 50 };
        });

        var action = EventNormalizer.FromManualClick("Bob", ActionType.Call);
        engine.ProcessAction(new IntPtr(1), 1, action);

        var seat = store.GetTable(new IntPtr(1))!.Seats[1];
        Assert.True(seat.Stats!.Vpip > 25); // VPIP should have increased
    }

    [Fact]
    public void ProcessAction_NullStats_DoesNotThrow()
    {
        var store = new StateStore();
        var apiClient = new ApiClient("http://fake.test:9999/api");
        var engine = new ActionEngine(store, apiClient);

        store.TryAddTable(new IntPtr(1), "T1", "p1");
        store.UpdateSeat(new IntPtr(1), 1, s =>
        {
            s.PlayerName = "Charlie";
            // Stats is null
        });

        var action = EventNormalizer.FromManualClick("Charlie", ActionType.CBet);
        engine.ProcessAction(new IntPtr(1), 1, action); // Should not throw
    }

    [Fact]
    public void ProcessAction_FiresOnActionApplied()
    {
        var store = new StateStore();
        var apiClient = new ApiClient("http://fake.test:9999/api");
        var engine = new ActionEngine(store, apiClient);
        ActionEvent? captured = null;

        engine.OnActionApplied += (hwnd, seatIdx, evt) => captured = evt;

        store.TryAddTable(new IntPtr(1), "T1", "p1");
        store.UpdateSeat(new IntPtr(1), 1, s =>
        {
            s.PlayerName = "Dave";
            s.Stats = new PlayerStats { PlayerId = "Dave" };
        });

        var action = EventNormalizer.FromManualClick("Dave", ActionType.FoldToThreeBet);
        engine.ProcessAction(new IntPtr(1), 1, action);

        Assert.NotNull(captured);
        Assert.Equal(ActionType.FoldToThreeBet, captured!.Type);
        Assert.Equal("Dave", captured.PlayerId);
    }
}
