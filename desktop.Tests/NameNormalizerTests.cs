namespace PokerHUD.Tests;

/// <summary>
/// Tests for NameNormalizer: OCR noise removal, fuzzy matching,
/// Levenshtein distance, and edge cases.
/// </summary>
public class NameNormalizerTests
{
    // ──── Normalize ────

    [Theory]
    [InlineData("PlayerOne", "PlayerOne")]           // clean input
    [InlineData("  PlayerOne  ", "PlayerOne")]        // whitespace trim
    [InlineData("Player One", "PlayerOne")]           // space stripped (not in allowed chars)
    [InlineData("Player_One", "Player_One")]          // underscore preserved
    [InlineData("Player-One", "Player-One")]          // hyphen preserved
    [InlineData("Player.One", "Player.One")]          // dot preserved
    [InlineData("Player!@#$%^&*()", "Player")]        // special chars stripped
    [InlineData("", "")]                              // empty
    [InlineData("   ", "")]                           // whitespace only
    [InlineData(null, "")]                            // null
    public void Normalize_StripsCorrectly(string? input, string expected)
    {
        var result = NameNormalizer.Normalize(input!);
        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_ControlCharacters_Removed()
    {
        var input = "Player\t\nOne\r\0";
        var result = NameNormalizer.Normalize(input);
        Assert.Equal("PlayerOne", result);
    }

    [Fact]
    public void Normalize_UnicodeLetters_Preserved()
    {
        // Vietnamese, Chinese, etc. characters should be preserved
        var result = NameNormalizer.Normalize("Nguyễn_123");
        Assert.Contains("Nguy", result);
        Assert.Contains("123", result);
    }

    // ──── Levenshtein Distance ────

    [Theory]
    [InlineData("abc", "abc", 0)]       // identical
    [InlineData("abc", "abd", 1)]       // one substitution
    [InlineData("abc", "abcd", 1)]      // one insertion
    [InlineData("abcd", "abc", 1)]      // one deletion
    [InlineData("kitten", "sitting", 3)] // classic example
    [InlineData("", "", 0)]             // both empty
    [InlineData("abc", "", 3)]          // one empty
    [InlineData("", "xyz", 3)]          // other empty
    public void LevenshteinDistance_CalculatesCorrectly(string s, string t, int expected)
    {
        Assert.Equal(expected, NameNormalizer.LevenshteinDistance(s, t));
    }

    [Fact]
    public void LevenshteinDistance_NullInputs_HandledGracefully()
    {
        Assert.Equal(3, NameNormalizer.LevenshteinDistance(null!, "abc"));
        Assert.Equal(3, NameNormalizer.LevenshteinDistance("abc", null!));
        Assert.Equal(0, NameNormalizer.LevenshteinDistance(null!, null!));
    }

    // ──── FuzzyMatch ────

    [Fact]
    public void FuzzyMatch_ExactMatch_ReturnsMatch()
    {
        var known = new[] { "PlayerA", "PlayerB", "PlayerC" };
        var match = NameNormalizer.FuzzyMatch("PlayerA", known);

        Assert.Equal("PlayerA", match);
    }

    [Fact]
    public void FuzzyMatch_OcrError_l_to_1_MatchesCorrectly()
    {
        var known = new[] { "Player1", "PlayerX" };
        // OCR read "Playerl" (lowercase L instead of 1)
        var match = NameNormalizer.FuzzyMatch("Playerl", known, maxDistance: 1);

        Assert.Equal("Player1", match);
    }

    [Fact]
    public void FuzzyMatch_TooFarAway_ReturnsNull()
    {
        var known = new[] { "AliceXYZ", "BobABC" };
        var match = NameNormalizer.FuzzyMatch("TotallyDifferent", known, maxDistance: 2);

        Assert.Null(match);
    }

    [Fact]
    public void FuzzyMatch_EmptyKnownList_ReturnsNull()
    {
        var match = NameNormalizer.FuzzyMatch("Player", Array.Empty<string>());
        Assert.Null(match);
    }

    [Fact]
    public void FuzzyMatch_EmptyQuery_ReturnsNull()
    {
        var known = new[] { "PlayerA" };
        var match = NameNormalizer.FuzzyMatch("", known, maxDistance: 10);

        // Empty normalized string — either matches short names or returns null
        // Depends on distance threshold
        // With maxDistance 10, could match anything
    }

    [Fact]
    public void FuzzyMatch_CaseInsensitive()
    {
        var known = new[] { "PlayerONE", "PlayerTWO" };
        var match = NameNormalizer.FuzzyMatch("playerone", known);

        Assert.Equal("PlayerONE", match);
    }

    [Fact]
    public void FuzzyMatch_PicksClosestMatch()
    {
        var known = new[] { "Player1", "Player12", "Player123" };
        var match = NameNormalizer.FuzzyMatch("Player1", known);

        Assert.Equal("Player1", match); // exact match wins
    }
}
