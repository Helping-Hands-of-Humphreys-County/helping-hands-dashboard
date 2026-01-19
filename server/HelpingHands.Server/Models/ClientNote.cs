namespace HelpingHands.Server.Models;

public sealed class ClientNote
{
    public Guid Id { get; set; }

    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public Guid AuthorUserId { get; set; }
    public AppUser AuthorUser { get; set; } = null!;

    public string Body { get; set; } = "";

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? EditedAt { get; set; }
    public bool IsDeleted { get; set; }
}
