<?php

namespace App\Services;

use App\Models\RecurringExpense;
use App\Models\Team;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class CashFlowPredictor
{
    /**
     * Get the current balance for a team.
     */
    public function getCurrentBalance(Team $team): float
    {
        $incomes = $team->transactions()->business()->income()->sum('amount');
        $expenses = $team->transactions()->business()->expense()->sum('amount');

        return (float) ($incomes - $expenses);
    }

    /**
     * Predict the cash flow balance after X days, factoring in recurring expenses.
     */
    public function predictBalanceAfterDays(Team $team, int $days): float
    {
        $currentBalance = $this->getCurrentBalance($team);

        $endDate = Carbon::now()->addDays($days);

        // Find recurring expenses that are active and business-related
        $recurringExpenses = $team->recurringExpenses()
            ->where('is_active', true)
            ->where('is_business', true)
            ->where('next_due_date', '<=', $endDate)
            ->get();

        $projectedExpenses = 0;

        foreach ($recurringExpenses as $expense) {
            $dueDate = Carbon::parse($expense->next_due_date);

            // Loop while due date is within our window
            while ($dueDate <= $endDate) {
                $projectedExpenses += $expense->amount;

                // Advance date based on frequency
                switch ($expense->frequency) {
                    case 'daily':
                        $dueDate->addDay();
                        break;
                    case 'weekly':
                        $dueDate->addWeek();
                        break;
                    case 'monthly':
                        $dueDate->addMonth();
                        break;
                    case 'yearly':
                        $dueDate->addYear();
                        break;
                    default:
                        // Prevent infinite loop if unexpected frequency
                        $dueDate = $endDate->copy()->addDay();
                }
            }
        }

        return $currentBalance - $projectedExpenses;
    }

    /**
     * Get daily forecast data points for chart formatting.
     */
    public function getForecastData(Team $team, int $days): Collection
    {
        $startDate = Carbon::now();
        $endDate = $startDate->copy()->addDays($days);

        $currentBalance = $this->getCurrentBalance($team);
        $data = collect();

        // Initialize balance
        $runningBalance = $currentBalance;

        $recurringExpenses = $team->recurringExpenses()
            ->where('is_active', true)
            ->where('is_business', true)
            ->get();

        // Calculate day by day
        for ($i = 0; $i <= $days; $i++) {
            $currentDay = $startDate->copy()->addDays($i);

            // Subtract expenses that fall on this day
            foreach ($recurringExpenses as $expense) {
                $expenseDueDate = Carbon::parse($expense->next_due_date);

                // Very basic matching - realistically you'd want proper recurring logic
                if ($this->isExpenseDueOnDate($expense, $currentDay, $expenseDueDate)) {
                    $runningBalance -= $expense->amount;
                }
            }

            $data->push([
                'date' => $currentDay->format('Y-m-d'),
                'predicted_balance' => $runningBalance,
            ]);
        }

        return $data;
    }

    private function isExpenseDueOnDate(RecurringExpense $expense, Carbon $targetDate, Carbon $initialDueDate): bool
    {
        if ($targetDate->startOfDay() < $initialDueDate->startOfDay()) {
            return false;
        }

        if ($targetDate->isSameDay($initialDueDate)) {
            return true;
        }

        // Simplistic check for demo purposes
        switch ($expense->frequency) {
            case 'daily':
                return true;
            case 'weekly':
                return $targetDate->dayOfWeek === $initialDueDate->dayOfWeek;
            case 'monthly':
                return $targetDate->day === $initialDueDate->day;
            case 'yearly':
                return $targetDate->month === $initialDueDate->month && $targetDate->day === $initialDueDate->day;
        }

        return false;
    }

    /**
     * Check if a proposed transaction would cause a liquidity crisis within 7 days.
     */
    public function wouldCauseLiquidityCrisis(Team $team, float $proposedExpenseAmount): bool
    {
        $predictedBalance = $this->predictBalanceAfterDays($team, 7);

        return ($predictedBalance - $proposedExpenseAmount) < 0;
    }
}
