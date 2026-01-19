namespace HelpingHands.Server.Dtos.Clients.Notes;

public sealed class ClientNoteDto
{
    public Guid Id { get; set; }
    public Guid ClientId { get; set; }
    public Guid AuthorUserId { get; set; }
    public string AuthorDisplayName { get; set; } = "";
    public string? AuthorEmail { get; set; }
    public string Body { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? EditedAt { get; set; }
    public bool IsDeleted { get; set; }
}
