namespace HelpingHands.Server.Models;

public sealed class AssistanceItem
{
    public Guid Id { get; set; }

    public Guid AssistanceEventId { get; set; }
    public AssistanceEvent AssistanceEvent { get; set; } = null!;

    public string ItemType { get; set; } = "FoodBox";
    public int Quantity { get; set; } = 1;
}