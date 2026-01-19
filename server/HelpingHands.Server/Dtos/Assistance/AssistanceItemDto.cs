namespace HelpingHands.Server.Dtos.Assistance;

public sealed class AssistanceItemDto
{
    public Guid Id { get; set; }
    public Guid AssistanceEventId { get; set; }
    public string ItemType { get; set; } = "FoodBox";
    public int Quantity { get; set; }
}
