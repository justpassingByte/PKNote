namespace PokerHUD.Tests;

/// <summary>
/// Tests for NormalizedBBox → PixelRect projection.
/// Covers: 1080p, 1440p, 4K, zero-size, boundary values, and round-trip accuracy.
/// </summary>
public class NormalizedBBoxTests
{
    [Theory]
    [InlineData(0.45, 0.12, 0.10, 0.08, 1920, 1080, 864, 129, 192, 86)]   // 1080p
    [InlineData(0.45, 0.12, 0.10, 0.08, 2560, 1440, 1152, 172, 256, 115)]  // 1440p
    [InlineData(0.45, 0.12, 0.10, 0.08, 3840, 2160, 1728, 259, 384, 172)]  // 4K
    public void ToPixelRect_MultiResolution_ProjectsAccurately(
        double x, double y, double w, double h,
        double winW, double winH,
        int expectedX, int expectedY, int expectedW, int expectedH)
    {
        var bbox = new NormalizedBBox { X = x, Y = y, W = w, H = h };

        var result = bbox.ToPixelRect(winW, winH);

        Assert.Equal(expectedX, result.X);
        Assert.Equal(expectedY, result.Y);
        Assert.Equal(expectedW, result.W);
        Assert.Equal(expectedH, result.H);
    }

    [Fact]
    public void ToPixelRect_ZeroSize_ReturnsZeroRect()
    {
        var bbox = new NormalizedBBox { X = 0.5, Y = 0.5, W = 0, H = 0 };

        var result = bbox.ToPixelRect(1920, 1080);

        Assert.Equal(0, result.W);
        Assert.Equal(0, result.H);
    }

    [Fact]
    public void ToPixelRect_FullWindow_ReturnsFullDimensions()
    {
        var bbox = new NormalizedBBox { X = 0, Y = 0, W = 1.0, H = 1.0 };

        var result = bbox.ToPixelRect(1920, 1080);

        Assert.Equal(0, result.X);
        Assert.Equal(0, result.Y);
        Assert.Equal(1920, result.W);
        Assert.Equal(1080, result.H);
    }

    [Fact]
    public void ToPixelRect_OriginCorner_ReturnsZeroOffset()
    {
        var bbox = new NormalizedBBox { X = 0, Y = 0, W = 0.1, H = 0.1 };

        var result = bbox.ToPixelRect(1000, 1000);

        Assert.Equal(0, result.X);
        Assert.Equal(0, result.Y);
        Assert.Equal(100, result.W);
        Assert.Equal(100, result.H);
    }

    [Fact]
    public void ToPixelRect_BottomRightCorner_MapsCorrectly()
    {
        var bbox = new NormalizedBBox { X = 0.9, Y = 0.9, W = 0.1, H = 0.1 };

        var result = bbox.ToPixelRect(1000, 1000);

        Assert.Equal(900, result.X);
        Assert.Equal(900, result.Y);
        Assert.Equal(100, result.W);
        Assert.Equal(100, result.H);
    }

    [Fact]
    public void ToRectangle_ConvertsToSystemDrawingRectangle()
    {
        var pixel = new PixelRect { X = 100, Y = 200, W = 300, H = 400 };

        var rect = pixel.ToRectangle();

        Assert.Equal(100, rect.X);
        Assert.Equal(200, rect.Y);
        Assert.Equal(300, rect.Width);
        Assert.Equal(400, rect.Height);
    }
}
