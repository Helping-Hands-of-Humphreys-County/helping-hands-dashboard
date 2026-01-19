namespace HelpingHands.Server.Dtos.SiteInfo;

public sealed class UpdateSiteInfoRequest
{
    public string? AboutText { get; set; }
    public string? ProgramsOverview { get; set; }
    public string? HoursText { get; set; }
    public string? LocationText { get; set; }
    public string? ContactText { get; set; }
    public string? WhatToBringText { get; set; }
}
