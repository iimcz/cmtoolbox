using System;
using System.Collections.Generic;

namespace backend.Utilities
{
    public static class DictionaryExtensions
    {
        public static void RemoveByValue<K, V>(this Dictionary<K, V> dict, Func<V, bool> selector)
        {
            HashSet<K> toRemove = new HashSet<K>();
            foreach (var pair in dict)
            {
                if (selector(pair.Value))
                    toRemove.Add(pair.Key);
            }

            foreach (var key in toRemove)
            {
                dict.Remove(key);
            }
        }

    }
}