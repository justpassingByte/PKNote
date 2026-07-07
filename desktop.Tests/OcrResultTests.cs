namespace PokerHUD.Tests;

/// <summary>
/// Tests for OcrResult confidence thresholds.
/// Design spec: >= 0.6 accept, 0.4-0.6 retry, < 0.4 fail.
/// </summary>
public class OcrResultTests
{
    // ──── ShouldAccept (>= 0.6) ────

    [Theory]
    [InlineData(0.6f, true)]
    [InlineData(0.7f, true)]
    [InlineData(0.99f, true)]
    [InlineData(1.0f, true)]
    [InlineData(0.59f, false)]
    [InlineData(0.0f, false)]
    public void ShouldAccept_ThresholdsCorrect(float confidence, bool expected)
    {
        var result = new OcrResult { Text = "SomeName", Confidence = confidence };
        Assert.Equal(expected, result.ShouldAccept);
    }

    // ──── ShouldRetry (0.4 <= c < 0.6) ────

    [Theory]
    [InlineData(0.4f, true)]
    [InlineData(0.5f, true)]
    [InlineData(0.59f, true)]
    [InlineData(0.6f, false)]    // should accept, not retry
    [InlineData(0.39f, false)]   // should fail
    [InlineData(0.0f, false)]
    public void ShouldRetry_ThresholdsCorrect(float confidence, bool expected)
    {
        var result = new OcrResult { Text = "SomeName", Confidence = confidence };
        Assert.Equal(expected, result.ShouldRetry);
    }

    // ──── ShouldFail (< 0.4 or empty text) ────

    [Theory]
    [InlineData(0.39f, "SomeName", true)]
    [InlineData(0.0f, "SomeName", true)]
    [InlineData(0.1f, "SomeName", true)]
    [InlineData(0.4f, "SomeName", false)]  // retry zone, not fail
    [InlineData(0.8f, "SomeName", false)]  // accept zone
    public void ShouldFail_BelowThreshold(float confidence, string text, bool expected)
    {
        var result = new OcrResult { Text = text, Confidence = confidence };
        Assert.Equal(expected, result.ShouldFail);
    }

    [Fact]
    public void ShouldFail_EmptyText_AlwaysTrue()
    {
        var result = new OcrResult { Text = "", Confidence = 0.9f };
        Assert.True(result.ShouldFail);
    }

    [Fact]
    public void ShouldFail_WhitespaceText_AlwaysTrue()
    {
        var result = new OcrResult { Text = "   ", Confidence = 0.9f };
        Assert.True(result.ShouldFail);
    }

    // ──── IsEmpty ────

    [Theory]
    [InlineData("", true)]
    [InlineData("   ", true)]
    [InlineData(null, true)]
    [InlineData("Player", false)]
    public void IsEmpty_ChecksCorrectly(string? text, bool expected)
    {
        var result = new OcrResult { Text = text ?? string.Empty, Confidence = 0.5f };
        // Need to handle null properly
        if (text == null)
        {
            result = new OcrResult { Confidence = 0.5f }; // defaults to empty
        }
        Assert.Equal(expected, result.IsEmpty);
    }
}
