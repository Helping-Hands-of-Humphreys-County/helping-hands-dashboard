using AutoMapper;
using AutoMapper.QueryableExtensions;
using HelpingHands.Server.Data;
using HelpingHands.Server.Dtos.Clients.Notes;
using HelpingHands.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpingHands.Server.Services;

public sealed class ClientNotesService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;

    public ClientNotesService(ApplicationDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<ClientNoteDto>> GetForClientAsync(Guid clientId, CancellationToken ct = default)
    {
        var notes = await _db.ClientNotes
            .AsNoTracking()
            .Where(x => x.ClientId == clientId && !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt)
            .ProjectTo<ClientNoteDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return notes;
    }

    public async Task<Guid?> CreateAsync(Guid clientId, Guid authorUserId, CreateClientNoteRequest dto, CancellationToken ct = default)
    {
        var exists = await _db.Clients.AnyAsync(x => x.Id == clientId, ct);
        if (!exists)
        {
            return null;
        }

        var note = new ClientNote
        {
            Id = Guid.NewGuid(),
            ClientId = clientId,
            AuthorUserId = authorUserId,
            Body = dto.Body,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.ClientNotes.Add(note);
        await _db.SaveChangesAsync(ct);
        return note.Id;
    }

    public async Task<bool> UpdateAsync(Guid clientId, Guid noteId, Guid authorUserId, UpdateClientNoteRequest dto, CancellationToken ct = default)
    {
        var note = await _db.ClientNotes.SingleOrDefaultAsync(x => x.Id == noteId && x.ClientId == clientId, ct);
        if (note is null || note.AuthorUserId != authorUserId)
        {
            return false;
        }

        note.Body = dto.Body;
        note.EditedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> SetDeletedAsync(Guid clientId, Guid noteId, bool isDeleted, Guid authorUserId, CancellationToken ct = default)
    {
        var note = await _db.ClientNotes.SingleOrDefaultAsync(x => x.Id == noteId && x.ClientId == clientId, ct);
        if (note is null || note.AuthorUserId != authorUserId)
        {
            return false;
        }

        note.IsDeleted = isDeleted;
        note.EditedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
