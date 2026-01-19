using System.Linq.Expressions;

namespace HelpingHands.Server.Infrastructure;

public static class SortHelpers
{
    public static IOrderedQueryable<T> OrderByOrDefault<T>(this IQueryable<T> source, string? sort, IReadOnlyDictionary<string, Expression<Func<T, object>>> map, Expression<Func<T, object>> defaultKey)
    {
        if (string.IsNullOrWhiteSpace(sort) || !map.TryGetValue(sort.TrimStart('-'), out var keySelector))
        {
            return source.OrderBy(defaultKey);
        }

        var descending = sort!.StartsWith("-");
        return descending
            ? source.OrderByDescending(keySelector)
            : source.OrderBy(keySelector);
    }
}
