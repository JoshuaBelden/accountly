export type BillFrequency =
	| 'monthly'
	| 'bimonthly'
	| 'weekly'
	| 'biweekly'
	| 'quarterly'
	| 'annually';

export interface Bill {
	id: string;
	name: string;
	amount: number;
	frequency: BillFrequency;
	dueDayOfMonth?: number;
	dueWeekday?: number;
	autoPay: boolean;
	accountId?: string;
	categoryId?: string;
	subcategoryId?: string;
	hints?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}
