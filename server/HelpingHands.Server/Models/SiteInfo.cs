namespace HelpingHands.Server.Models;

public class SiteInfo
{
    public int Id { get; set; }

    public string? AboutText { get; set; }
    public string? ProgramsOverview { get; set; }
    public string? HoursText { get; set; }
    public string? LocationText { get; set; }
    public string? ContactText { get; set; }
    public string? WhatToBringText { get; set; }

    public Guid? UpdatedByUserId { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
