namespace PokerHUD.Tests;

/// <summary>
/// Tests for SeatEvent model behavior: join/leave detection, event properties.
/// </summary>
public class SeatEventTests
{
    [Fact]
    public void IsJoin_WhenEmptyToOccupied_ReturnsTrue()
    {
        var evt = new SeatEvent
        {
            PreviousStatus = Occupancy.Empty,
            NewStatus = Occupancy.Occupied
        };
        Assert.True(evt.IsJoin);
        Assert.False(evt.IsLeave);
    }

    [Fact]
    public void IsJoin_WhenUnknownToOccupied_ReturnsTrue()
    {
        var evt = new SeatEvent
        {
            PreviousStatus = Occupancy.Unknown,
            NewStatus = Occupancy.Occupied
        };
        Assert.True(evt.IsJoin);
    }

    [Fact]
    public void IsLeave_WhenOccupiedToEmpty_ReturnsTrue()
    {
        var evt = new SeatEvent
        {
            PreviousStatus = Occupancy.Occupied,
            NewStatus = Occupancy.Empty
        };
        Assert.True(evt.IsLeave);
        Assert.False(evt.IsJoin);
    }

    [Fact]
    public void IsLeave_WhenOccupiedToUnknown_ReturnsFalse()
    {
        var evt = new SeatEvent
        {
            PreviousStatus = Occupancy.Occupied,
            NewStatus = Occupancy.Unknown
        };
        Assert.False(evt.IsLeave);
    }

    [Fact]
    public void NoChange_NeitherJoinNorLeave()
    {
        var evt = new SeatEvent
        {
            PreviousStatus = Occupancy.Empty,
            NewStatus = Occupancy.Empty
        };
        Assert.False(evt.IsJoin);
        Assert.False(evt.IsLeave);
    }

    [Fact]
    public void Timestamp_DefaultsToUtcNow()
    {
        var before = DateTime.UtcNow.AddSeconds(-1);
        var evt = new SeatEvent();
        var after = DateTime.UtcNow.AddSeconds(1);

        Assert.InRange(evt.Timestamp, before, after);
    }
}
