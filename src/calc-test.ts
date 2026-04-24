import { transactionsData } from './data';

let cash = 1000000;
let exactCash = 1000000.0;
console.log('Initial cash:', cash);

transactionsData.forEach(tx => {
    if (tx.type === 'Deposit') {}
    else if (tx.type === 'Buy') {
        const total = tx.qty * tx.price;
        cash -= total;
        cash -= tx.commission || 0;
        exactCash -= tx.total;
        exactCash -= tx.commission || 0;
        console.log(`Buy ${tx.symbol}: qty=${tx.qty}, price=${tx.price}, total=${total}, exact=${tx.total}, commission=${tx.commission}. Cash is now ${cash}. exact is ${exactCash}`);
    }
    else if (tx.type === 'Sell') {
        const total = tx.qty * tx.price;
        cash += total;
        cash -= tx.commission || 0;
        exactCash += tx.total;
        exactCash -= tx.commission || 0;
        console.log(`Sell ${tx.symbol}: qty=${tx.qty}, price=${tx.price}, total=${total}, exact=${tx.total}, commission=${tx.commission}. Cash is now ${cash}. exact is ${exactCash}`);
    }
});

console.log('Final calculated cash:', cash);
console.log('Final EXACT cash:', exactCash);
