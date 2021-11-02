import moment from 'moment';
import { createTransaction, isMatch, findTarget } from './transactions';

it('Creates a transaction', () => {
    const description = 'This is the expected description.';
    const date = new moment('2021-11-01');
    const amount = 7.77;

    const transaction = createTransaction(description, date, amount);
    expect(transaction.id).toBeDefined();
    expect(transaction.description).toBe(description);
    expect(transaction.date).toBe(date);
    expect(transaction.amount).toBe(amount);
});

it('Match a transaction to a source', () => {
    const map = {
        matches: [
            '.*chevron.*'
        ],
        target: {
            name: 'Chevron',
            type: 'category',
            id: '37b74645-b1e8-42de-bf3c-9dc72c9b2e39',
        }
    };
    const transaction = createTransaction('mock transaction - POS CHEVRON atl');
    const result = isMatch(transaction, map);
    expect(result).toBeTruthy();
})

it('Finds a transaction target', () => {
    const maps = [
        {
            matches: [
                '.*chevron.*'
            ],
            target: {
                name: 'Chevron',
                type: 'category',
                id: '37b74645-b1e8-42de-bf3c-9dc72c9b2e39',
            }
    }];
    const transaction = createTransaction('mock transaction - POS CHEVRON atl');
    transaction.target = findTarget(transaction, maps);

    expect(transaction.target).toBeDefined();
    expect(transaction.target.name).toBe('Chevron');
    expect(transaction.target.type).toBe('category');
    expect(transaction.target.id).toBe('37b74645-b1e8-42de-bf3c-9dc72c9b2e39');
})