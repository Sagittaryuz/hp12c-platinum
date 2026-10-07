export function presentHistoryItem(item,decimalComma){
 const sourceComma=item.decimalComma!==false;
 const display=sourceComma===decimalComma?item.display:item.display.replaceAll('.', '\u0000').replaceAll(',', '.').replaceAll('\u0000', ',');
 const operation=decimalComma?item.operation.replace(/(?<=\d)\.(?=\d)/g,','):item.operation;
 return {...item,display,operation};
}
export function presentHistorySession(session,decimalComma){return {...session,entries:session.entries.map(item=>presentHistoryItem(item,decimalComma))}}
