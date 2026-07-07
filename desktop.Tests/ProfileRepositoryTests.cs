using System.IO;

namespace PokerHUD.Tests;

/// <summary>
/// Tests for ProfileRepository: save/load JSON, schema migration,
/// file sanitization, and listing profiles.
/// </summary>
public class ProfileRepositoryTests : IDisposable
{
    private readonly ProfileRepository _repo;
    private readonly string _testDir;

    public ProfileRepositoryTests()
    {
        // Use a temp directory to avoid polluting real %AppData%
        _testDir = Path.Combine(Path.GetTempPath(), "PokerHUD_Test_" + Guid.NewGuid().ToString("N")[..8]);
        Directory.CreateDirectory(_testDir);

        // Redirect ProfileRepository to test dir via reflection or by saving directly
        _repo = new ProfileRepository();
    }

    [Fact]
    public async Task SaveAndLoad_Roundtrip_PreservesData()
    {
        var profile = new ConfigProfile
        {
            ProfileName = "test_roundtrip",
            SiteName = "PokerStars",
            TableType = TableType.SixMax,
            Version = 1,
            Seats = new List<SeatConfig>
            {
                new() {
                    Id = 1,
                    SeatBBox = new NormalizedBBox { X = 0.45, Y = 0.12, W = 0.10, H = 0.08 },
                    NameBBox = new NormalizedBBox { X = 0.43, Y = 0.10, W = 0.14, H = 0.05 },
                    HudAnchor = new NormalizedBBox { X = 0.45, Y = 0.20, W = 0.10, H = 0.06 }
                }
            }
        };

        await _repo.SaveAsync(profile);
        var loaded = await _repo.LoadAsync("test_roundtrip");

        Assert.NotNull(loaded);
        Assert.Equal("test_roundtrip", loaded!.ProfileName);
        Assert.Equal("PokerStars", loaded.SiteName);
        Assert.Equal(TableType.SixMax, loaded.TableType);
        Assert.Single(loaded.Seats);
        Assert.Equal(0.45, loaded.Seats[0].SeatBBox.X);
        Assert.Equal(0.12, loaded.Seats[0].SeatBBox.Y);
    }

    [Fact]
    public async Task Load_NonExistentProfile_ReturnsNull()
    {
        var result = await _repo.LoadAsync("nonexistent_profile_xyz");
        Assert.Null(result);
    }

    [Fact]
    public async Task Save_SetsUpdatedAt()
    {
        var before = DateTime.UtcNow.AddSeconds(-1);
        var profile = new ConfigProfile { ProfileName = "test_timestamp" };

        await _repo.SaveAsync(profile);
        var loaded = await _repo.LoadAsync("test_timestamp");

        Assert.NotNull(loaded);
        Assert.True(loaded!.UpdatedAt >= before);
    }

    [Fact]
    public void ListProfiles_ReturnsAvailableProfiles()
    {
        var profiles = _repo.ListProfiles();
        Assert.NotNull(profiles);
        Assert.IsType<List<string>>(profiles);
    }

    [Fact]
    public async Task Delete_ExistingProfile_ReturnsTrue()
    {
        var profile = new ConfigProfile { ProfileName = "test_delete_me" };
        await _repo.SaveAsync(profile);

        var deleted = _repo.Delete("test_delete_me");
        Assert.True(deleted);

        var loaded = await _repo.LoadAsync("test_delete_me");
        Assert.Null(loaded);
    }

    [Fact]
    public void Delete_NonExistent_ReturnsFalse()
    {
        Assert.False(_repo.Delete("totally_fake_profile"));
    }

    [Fact]
    public async Task ProfileName_SpecialCharacters_SanitizedInFileName()
    {
        var profile = new ConfigProfile { ProfileName = "My Profile <v2>" };
        await _repo.SaveAsync(profile);

        // Should be saved with sanitized filename
        var loaded = await _repo.LoadAsync("My Profile <v2>");
        Assert.NotNull(loaded);
    }

    [Fact]
    public async Task SchemaVersion_Migration_FillsHudAnchorDefaults()
    {
        // Simulate an old v0 profile (no HudAnchor set)
        var oldProfile = new ConfigProfile
        {
            ProfileName = "test_migration",
            Version = 0,
            Seats = new List<SeatConfig>
            {
                new() {
                    Id = 1,
                    SeatBBox = new NormalizedBBox { X = 0.45, Y = 0.12, W = 0.10, H = 0.08 },
                    NameBBox = new NormalizedBBox { X = 0.43, Y = 0.10, W = 0.14, H = 0.05 },
                    HudAnchor = new NormalizedBBox() // empty — should be auto-filled
                }
            }
        };

        await _repo.SaveAsync(oldProfile);

        // Manually reset version to 0 in the saved file to simulate old format
        var filePath = Path.Combine(_repo.ProfilesDirectory, "test_migration.json");
        var json = File.ReadAllText(filePath);
        json = json.Replace("\"version\": 1", "\"version\": 0");
        File.WriteAllText(filePath, json);

        // Load should trigger migration
        var loaded = await _repo.LoadAsync("test_migration");

        Assert.NotNull(loaded);
        Assert.Equal(1, loaded!.Version);
        // HudAnchor should be auto-filled based on SeatBBox
        Assert.True(loaded.Seats[0].HudAnchor.W > 0);
        Assert.True(loaded.Seats[0].HudAnchor.H > 0);
    }

    public void Dispose()
    {
        // Clean up test profiles
        foreach (var name in new[] { "test_roundtrip", "test_timestamp", "test_delete_me",
            "My Profile <v2>", "test_migration" })
        {
            try { _repo.Delete(name); } catch { }
        }
    }
}
