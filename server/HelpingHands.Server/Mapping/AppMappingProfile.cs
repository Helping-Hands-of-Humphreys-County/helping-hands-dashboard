using AutoMapper;
using HelpingHands.Server.Dtos.Auth;
using HelpingHands.Server.Dtos.Applications;
using HelpingHands.Server.Dtos.Assistance;
using HelpingHands.Server.Dtos.Clients;
using HelpingHands.Server.Dtos.Clients.Notes;
using HelpingHands.Server.Dtos.Households;
using HelpingHands.Server.Dtos.SiteInfo;
using HelpingHands.Server.Dtos.Users;
using HelpingHands.Server.Models;

namespace HelpingHands.Server.Mapping;

public sealed class AppMappingProfile : Profile
{
    public AppMappingProfile()
    {
        CreateMap<AppUser, MeDto>()
            .ForMember(d => d.Email, opt => opt.MapFrom(s => s.Email ?? ""))
            .ForMember(d => d.MustChangePassword, opt => opt.MapFrom(s => s.MustChangePassword));

        CreateMap<AppUser, UserListItemDto>();
        CreateMap<AppUser, UserDetailsDto>();

        CreateMap<SiteInfo, SiteInfoDto>();

        CreateMap<Client, ClientListItemDto>()
            .ForMember(d => d.Street1, opt => opt.MapFrom(s => s.Household != null ? s.Household.Street1 : null))
            .ForMember(d => d.City, opt => opt.MapFrom(s => s.Household != null ? s.Household.City : null))
            .ForMember(d => d.State, opt => opt.MapFrom(s => s.Household != null ? s.Household.State : null))
            .ForMember(d => d.Zip, opt => opt.MapFrom(s => s.Household != null ? s.Household.Zip : null));

        CreateMap<Client, ClientDetailsDto>()
            .ForMember(d => d.Household, opt => opt.MapFrom(s => s.Household));

        CreateMap<ClientNote, ClientNoteDto>()
            .ForMember(d => d.AuthorDisplayName, opt => opt.MapFrom(s => s.AuthorUser.DisplayName))
            .ForMember(d => d.AuthorEmail, opt => opt.MapFrom(s => s.AuthorUser.Email));

        CreateMap<ClientNote, HouseholdNoteDto>()
            .ForMember(d => d.AuthorDisplayName, opt => opt.MapFrom(s => s.AuthorUser.DisplayName))
            .ForMember(d => d.AuthorEmail, opt => opt.MapFrom(s => s.AuthorUser.Email))
            .ForMember(d => d.ClientName, opt => opt.MapFrom(s => (((s.Client!.FirstName ?? string.Empty) + " " + (s.Client!.LastName ?? string.Empty)).Trim())));

        CreateMap<CreateClientRequest, Client>();
        CreateMap<UpdateClientRequest, Client>();

        CreateMap<Household, HouseholdSummaryDto>();
        CreateMap<Household, HouseholdListItemDto>()
            .ForMember(d => d.MemberCount, opt => opt.MapFrom(s => s.Clients.Count))
            .ForMember(d => d.LastActivityAt, opt => opt.MapFrom(s =>
                s.AssistanceEvents
                    .OrderByDescending(a => a.OccurredAt)
                    .Select(a => (DateTimeOffset?)a.OccurredAt)
                    .FirstOrDefault()
                ?? s.Applications
                    .OrderByDescending(a => a.SubmittedAt ?? a.CreatedAt)
                    .Select(a => (DateTimeOffset?)(a.SubmittedAt ?? a.CreatedAt))
                    .FirstOrDefault()
                ?? s.UpdatedAt));
        CreateMap<Household, HouseholdDetailsDto>()
            .ForMember(d => d.Members, opt => opt.MapFrom(s => s.Clients));

        CreateMap<CreateHouseholdRequest, Household>();
        CreateMap<UpdateHouseholdAddressRequest, Household>();

        CreateMap<Application, ApplicationListItemDto>()
            .ForMember(d => d.ApplicantName, opt => opt.MapFrom(s => (((s.ApplicantClient.FirstName ?? string.Empty) + " " + (s.ApplicantClient.LastName ?? string.Empty)).Trim())))
            .ForMember(d => d.Street1, opt => opt.MapFrom(s => s.Household.Street1))
            .ForMember(d => d.Street2, opt => opt.MapFrom(s => s.Household.Street2))
            .ForMember(d => d.City, opt => opt.MapFrom(s => s.Household.City))
            .ForMember(d => d.State, opt => opt.MapFrom(s => s.Household.State))
            .ForMember(d => d.Zip, opt => opt.MapFrom(s => s.Household.Zip));

        CreateMap<Application, ApplicationDetailsDto>()
            .ForMember(d => d.ApplicantName, opt => opt.MapFrom(s => (((s.ApplicantClient.FirstName ?? string.Empty) + " " + (s.ApplicantClient.LastName ?? string.Empty)).Trim())))
            .ForMember(d => d.Street1, opt => opt.MapFrom(s => s.Household.Street1))
            .ForMember(d => d.Street2, opt => opt.MapFrom(s => s.Household.Street2))
            .ForMember(d => d.City, opt => opt.MapFrom(s => s.Household.City))
            .ForMember(d => d.State, opt => opt.MapFrom(s => s.Household.State))
            .ForMember(d => d.Zip, opt => opt.MapFrom(s => s.Household.Zip))
            .ForMember(d => d.HouseholdMembers, opt => opt.MapFrom(s => s.HouseholdMembers))
            .ForMember(d => d.BillRequests, opt => opt.MapFrom(s => s.BillRequests));

        CreateMap<ApplicationHouseholdMember, ApplicationHouseholdMemberDto>();
        CreateMap<ApplicationBillRequest, ApplicationBillRequestDto>();

        CreateMap<CreateApplicationHouseholdMemberRequest, ApplicationHouseholdMember>();
        CreateMap<CreateApplicationBillRequestRequest, ApplicationBillRequest>();

        CreateMap<CreateApplicationRequest, Application>()
            .ForMember(d => d.HouseholdMembers, opt => opt.Ignore())
            .ForMember(d => d.BillRequests, opt => opt.Ignore());

        CreateMap<UpdateApplicationRequest, Application>()
            .ForMember(d => d.HouseholdMembers, opt => opt.Ignore())
            .ForMember(d => d.BillRequests, opt => opt.Ignore());

        CreateMap<AssistanceEvent, AssistanceEventListItemDto>()
            .ForMember(d => d.HouseholdMemberCount, opt => opt.MapFrom(s => s.HouseholdMemberCount))
            .ForMember(d => d.Street1, opt => opt.MapFrom(s => s.Household.Street1))
            .ForMember(d => d.Street2, opt => opt.MapFrom(s => s.Household.Street2))
            .ForMember(d => d.City, opt => opt.MapFrom(s => s.Household.City))
            .ForMember(d => d.State, opt => opt.MapFrom(s => s.Household.State))
            .ForMember(d => d.Zip, opt => opt.MapFrom(s => s.Household.Zip))
            .ForMember(d => d.ClientName, opt => opt.MapFrom(s => s.Client == null ? null : (((s.Client.FirstName ?? string.Empty) + " " + (s.Client.LastName ?? string.Empty)).Trim())))
            .ForMember(d => d.RecordedByUserDisplayName, opt => opt.MapFrom(s => s.RecordedByUser.DisplayName))
            .ForMember(d => d.Items, opt => opt.MapFrom(s => s.Items));

        CreateMap<AssistanceEvent, AssistanceEventDetailsDto>()
            .ForMember(d => d.HouseholdMemberCount, opt => opt.MapFrom(s => s.HouseholdMemberCount))
            .ForMember(d => d.Street1, opt => opt.MapFrom(s => s.Household.Street1))
            .ForMember(d => d.Street2, opt => opt.MapFrom(s => s.Household.Street2))
            .ForMember(d => d.City, opt => opt.MapFrom(s => s.Household.City))
            .ForMember(d => d.State, opt => opt.MapFrom(s => s.Household.State))
            .ForMember(d => d.Zip, opt => opt.MapFrom(s => s.Household.Zip))
            .ForMember(d => d.ClientName, opt => opt.MapFrom(s => s.Client == null ? null : (((s.Client.FirstName ?? string.Empty) + " " + (s.Client.LastName ?? string.Empty)).Trim())))
            .ForMember(d => d.RecordedByUserDisplayName, opt => opt.MapFrom(s => s.RecordedByUser.DisplayName))
            .ForMember(d => d.Items, opt => opt.MapFrom(s => s.Items));

        CreateMap<AssistanceItem, AssistanceItemDto>();

        CreateMap<AssistanceItemDto, AssistanceItem>();
    }
}
