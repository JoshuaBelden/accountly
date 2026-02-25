# Accountly

A personal finance manager for the average person using Svelte with Typescript and Vite. Developers will find a handy .gitignore in the root along with a vscode launch settings file for debugging in the browser.

## Styles

You'll find the accountly app incredibly intuitive to use with easy navigation and professional looking styles that render a dark mode that is easy on the eyes. You'll find a centered top navigation for access to the most use screens a click away. The top left will give you an overview of your total account value and other pertinent information visible at all times.

## Data Persistence

All of your data remains in your browser using local storage so no data is passed anywhere. For safety, we offer an export button in the settings screen that allows you to import and export your data.

## Accounts

The accounts screen is where you can setup all of your Checking, Savings, and Loan information. Loans allow you to specify when your payment is due and what the total remaining balance of the loan is.

Additionally, we allow you to enter information about your paychecks, what days you get paid on and what the expected amount will be.

Accounts also allow you to specify assets such as mortgages and vehicle loans as well as investments and current balances.

## Bills

The bills screen is a lot like the accounts screen but is for recurring bills such as utilities and internet.

## Monthly Planner

Finally we have the monthly planner. This is your month preview of your finances and the bills you have to pay. We allow setting up when a bill is paid based on when you get paid. While most financial planners force you to start paying bills on the first, many people don't get a paycheck until the 10th. The Monthly Planner is smart about knowing that on the first, you may be paying bills from the previous month so we allow you to customize the date your planner is based on.

In the planner we show you the bills that need to be paid as well as if they've actually cleared. After paying bills, you can then return to the planner to mark transactions as cleared.

## Budget

Accountly allows you to setup your own categories for budgeting that allows top level categories out of the box as well as adding sub categories for more fine-grain budgeting. Your monthly planner allows you to add adhoc transactions against an account such as savings and checking. The budget page will then show you based on your Monthly pay dates what your expected budget is per category and what actually has been spent, providing tons of useful charts. Transactions can also be split, so if you've purchased groceries along with some household items, you can track the categories individually for the entire purchase.

## Net Worth

The Net Worth value is displayed at the top of the screen, but we also offer a page that breaks everything down for you. The Financial Forecast report gives you a timeline based on current budgets and loan values, when things will be paid off.
