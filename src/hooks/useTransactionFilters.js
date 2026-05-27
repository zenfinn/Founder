import { useMemo, useState } from "react";

export function useTransactionFilters(transactions) {
  const [searchValue, setSearchValue] = useState("");
  const [filterMode, setFilterMode] = useState("all");

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return transactions.filter((item) => {
      const matchesSearch =
        item.vendor.toLowerCase().includes(normalizedSearch) ||
        item.category.toLowerCase().includes(normalizedSearch);

      const matchesFilter =
        filterMode === "all" ||
        (filterMode === "found" && item.receiptFound) ||
        (filterMode === "missing" && !item.receiptFound);

      return matchesSearch && matchesFilter;
    });
  }, [transactions, searchValue, filterMode]);

  return {
    searchValue,
    setSearchValue,
    filterMode,
    setFilterMode,
    filteredTransactions,
  };
}
