namespace PokerHUD.Tests;

/// <summary>
/// Tests for ConfigProfile model: JSON schema, seat configurations, table types.
/// </summary>
public class ConfigProfileTests
{
    [Fact]
    public void DefaultValues_AreCorrect()
    {
        var profile = new ConfigProfile();

        Assert.Equal(1, profile.Version);
        Assert.Equal(string.Empty, profile.ProfileName);
        Assert.Equal(string.Empty, profile.SiteName);
        Assert.Equal(TableType.SixMax, profile.TableType);
        Assert.NotNull(profile.Seats);
        Assert.Empty(profile.Seats);
    }

    [Fact]
    public void SeatConfig_DefaultBBoxes_AreZero()
    {
        var seat = new SeatConfig();

        Assert.Equal(0, seat.SeatBBox.X);
        Assert.Equal(0, seat.SeatBBox.W);
        Assert.Equal(0, seat.NameBBox.H);
        Assert.Equal(0, seat.HudAnchor.Y);
    }

    [Fact]
    public void SeatState_DefaultValues_AreCorrect()
    {
        var state = new SeatState();

        Assert.Equal(Occupancy.Unknown, state.Status);
        Assert.Equal(string.Empty, state.PlayerName);
        Assert.Equal(string.Empty, state.LastValidName);
        Assert.False(state.OcrFailed);
        Assert.False(state.ManualOverride);
        Assert.False(state.IsHeroSeat);
        Assert.Equal(0, state.OcrRetryCount);
        Assert.Equal(0f, state.OcrConfidence);
        Assert.Null(state.Stats);
    }

    [Theory]
    [InlineData(TableType.SixMax)]
    [InlineData(TableType.EightMax)]
    [InlineData(TableType.NineMax)]
    public void TableType_AllValuesSupported(TableType type)
    {
        var profile = new ConfigProfile { TableType = type };
        Assert.Equal(type, profile.TableType);
    }

    [Fact]
    public void ActionType_AllValuesExist()
    {
        var types = Enum.GetValues<ActionType>();

        Assert.Contains(ActionType.CBet, types);
        Assert.Contains(ActionType.FoldToCBet, types);
        Assert.Contains(ActionType.ThreeBet, types);
        Assert.Contains(ActionType.FoldToThreeBet, types);
        Assert.Contains(ActionType.FourBet, types);
        Assert.Contains(ActionType.FoldToFourBet, types);
        Assert.Contains(ActionType.Call, types);
        Assert.Contains(ActionType.Check, types);
        Assert.Contains(ActionType.Raise, types);
        Assert.Equal(9, types.Length);
    }

    [Fact]
    public void Occupancy_AllValuesExist()
    {
        var values = Enum.GetValues<Occupancy>();

        Assert.Contains(Occupancy.Empty, values);
        Assert.Contains(Occupancy.Occupied, values);
        Assert.Contains(Occupancy.Unknown, values);
        Assert.Equal(3, values.Length);
    }
}
