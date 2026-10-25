# ⚡ QuickSplit — Precision Cost Allocation & Instant Clearance

> **Tagline:** *Precision Cost Allocation & Instant Clearance.*  
> **Subtitle:** *Fast, Fair & Transparent Group Expense Settlement for Projects & Residences.*

**QuickSplit** is a precision financial allocation tool designed for college capstone teams, engineering lab projects, hackathons, and shared residences.

---

## 🎯 Always Strictly Sorted & Professional

QuickSplit ensures all financial data is **strictly sorted** so you never have to hunt for who spent what:

1. **📊 Spending Breakdown (Analytics Tab)**:
   - **Categories**: Filtered and sorted descending by highest spending first (`#1`, `#2`, `#3` ranking badges with exact percentage `0.0%`).
   - **Payers (Who Fronted Money)**: Sorted strictly from **Highest Contributor to Lowest Contributor**, complete with rank badges (`#1`, `#2`, etc.) and contribution percentages.
   - **Executive Snapshot**: Highlights the Top Category, Highest Contributor, and Equal Fair Share per person.

2. **👥 Member Balances Tab**:
   - **Receivers First**: Friends who are owed money (`+₹...`) are placed at the front with a `🟢 Receiver` badge.
   - **Settled Friends**: Friends with `₹0` balance in the middle (`Settled` badge).
   - **Payers After**: Friends who owe money (`-₹...`) placed after with a `🔴 Payer` badge and instant settlement button.

3. **💸 Direct Settlement Banner ("Who Pays Whom")**:
   - Algorithmic greedy min-cash-flow transfers sorted descending by highest payment amount first.

4. **📋 Expense Log**:
   - Sorted by newest date first, with tie-breakers sorted by highest transaction amount.

5. **📜 Cleared Payments History**:
   - Audited payment records sorted chronologically by newest clearance first.

---

## 💡 Multi-Contributor Example
> *"You paid ₹500, Friend 1 paid ₹300, and Friend 2 paid ₹400 for a total bill of ₹1,200."*

1. **QuickSplit** calculates:
   - Equal share: **₹400.00 each**
   - **You**: +₹100 (Receives)
   - **Friend 1**: -₹100 (Owes)
   - **Friend 2**: ₹0 (Settled)
2. **Instant Settlement Instruction**:
   👉 **`Friend 1 pays You ➔ ₹100.00`** with direct UPI deep links (GPay, PhonePe, Paytm).

---

## 🚀 Quick Start
Run locally:
```powershell
python -m http.server 4173
```
Or open `index.html` directly in any web browser.
