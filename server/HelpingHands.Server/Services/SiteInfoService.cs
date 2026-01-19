using AutoMapper;
using HelpingHands.Server.Data;
using HelpingHands.Server.Dtos.SiteInfo;
using HelpingHands.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpingHands.Server.Services;

public sealed class SiteInfoService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;

    public SiteInfoService(ApplicationDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<SiteInfoDto> GetAsync()
    {
        var entity = await _db.SiteInfo.AsNoTracking().SingleAsync(x => x.Id == 1);
        return _mapper.Map<SiteInfoDto>(entity);
    }

    public async Task UpdateAsync(UpdateSiteInfoRequest dto, Guid updatedByUserId)
    {
        var entity = await _db.SiteInfo.SingleAsync(x => x.Id == 1);

        entity.AboutText = dto.AboutText;
        entity.ProgramsOverview = dto.ProgramsOverview;
        entity.HoursText = dto.HoursText;
        entity.LocationText = dto.LocationText;
        entity.ContactText = dto.ContactText;
        entity.WhatToBringText = dto.WhatToBringText;

        entity.UpdatedAt = DateTimeOffset.UtcNow;
        entity.UpdatedByUserId = updatedByUserId;

        await _db.SaveChangesAsync();
    }
}
