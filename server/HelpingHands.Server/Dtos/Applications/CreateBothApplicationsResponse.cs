namespace HelpingHands.Server.Dtos.Applications;

public sealed class CreateBothApplicationsResponse
{
    public Guid FoodPantryApplicationId { get; set; }
    public Guid HelpingHandsApplicationId { get; set; }
}
