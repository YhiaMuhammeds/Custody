// ✅ تم التعديل حسب طلبك
import { db } from './firebase-config.js';
import {
  collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// DOM Elements
const custodyForm = document.getElementById('custodyForm');
const expenseForm = document.getElementById('expenseForm');
const expensesTable = document.getElementById('expensesTable');
const totalCustodiesSpan = document.getElementById('totalCustodies');
const totalSpan = document.getElementById('totalExpenses');
const remainingSpan = document.getElementById('remaining');
const filterFrom = document.getElementById('filterFrom');
const filterTo = document.getElementById('filterTo');
const applyFilter = document.getElementById('applyFilter');
const monthFilter = document.getElementById('monthFilter');
const filterDate = document.getElementById('filterDate');
const searchInput = document.getElementById('searchItem');
const clearCustodyBtn = document.getElementById('clearCustodyBtn');

// Firebase Collections
const custodyCol = collection(db, 'custodies');
const expensesCol = collection(db, 'expenses');

// Cached Lists
let custodyList = [];
let expenseList = [];

// Add Custody
custodyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('custodyName').value;
  const amount = +document.getElementById('custodyAmount').value;
  const date = document.getElementById('custodyDate').value || new Date().toISOString();

  try {
    await addDoc(custodyCol, { name, total_amount: amount, date });
    custodyForm.reset();
    console.log("✅ تم إضافة العهدة");
  } catch (err) {
    console.error("❌ خطأ أثناء الإضافة:", err);
  }
});

// Add Expense
expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const item = document.getElementById('item').value;
  const amount = +document.getElementById('expenseAmount').value;
  const date = document.getElementById('expenseDate').value || new Date().toISOString().split('T')[0];
  const note = document.getElementById('note').value;

  try {
    await addDoc(expensesCol, { item, amount, date, note });
    expenseForm.reset();
    console.log("✅ تم إضافة المصروف");
  } catch (err) {
    console.error("❌ خطأ أثناء الإضافة:", err);
  }
});

// Snapshot listeners
onSnapshot(custodyCol, (snapshot) => {
  custodyList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'custody' }));
  calculateAndRender();
});

onSnapshot(expensesCol, (snapshot) => {
  expenseList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'expense' }));
  populateMonthFilter();
  calculateAndRender();
});

// Filtering
applyFilter.addEventListener('click', calculateAndRender);
monthFilter.addEventListener('change', calculateAndRender);
filterDate.addEventListener('change', calculateAndRender);

// Search
searchInput.addEventListener('input', function (e) {
  const keyword = e.target.value.toLowerCase();
  const filtered = expenseList.filter(exp =>
    exp.item && exp.item.toLowerCase().includes(keyword)
  );
  renderFilteredExpenses(filtered);
});

// Excel Export
window.exportToExcel = function () {
  const table = document.querySelector("table");
  const wb = XLSX.utils.table_to_book(table, { sheet: "التقرير" });
  XLSX.writeFile(wb, "custody_report.xlsx");
};

document.getElementById('exportExcel').addEventListener('click', exportToExcel);

// Clear all custody
clearCustodyBtn?.addEventListener('click', async () => {
  if (!confirm('هل أنت متأكد من حذف كل العهد؟')) return;
  for (const c of custodyList) {
    await deleteDoc(doc(db, 'custodies', c.id));
  }
});

// Helpers
function extractMonth(dateStr) {
  return dateStr.slice(0, 7);
}

function populateMonthFilter() {
  const months = new Set(expenseList.map(e => extractMonth(e.date)));
  monthFilter.innerHTML = `<option value="all">كل الشهور</option>`;
  Array.from(months).sort().forEach(month => {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = month;
    monthFilter.appendChild(option);
  });
}

function calculateAndRender() {
  const totalCustody = custodyList.reduce((acc, c) => acc + (c.total_amount || 0), 0);

   let combinedList = [...expenseList, ...custodyList.map(c => ({
    id: c.id,
    item: c.name,
    amount: c.total_amount,
    date: c.date,
    note: 'عهدة',
    type: 'custody'
  }))];

  // ✅ الترتيب من الأحدث إلى الأقدم
  combinedList.sort((a, b) => new Date(b.date) - new Date(a.date));

  const from = filterFrom.value;
  const to = filterTo.value;
  const selectedMonth = monthFilter.value;
  const selectedDate = filterDate.value;

  if (from) combinedList = combinedList.filter(e => e.date >= from);
  if (to) combinedList = combinedList.filter(e => e.date <= to);
  if (selectedMonth !== 'all') combinedList = combinedList.filter(e => extractMonth(e.date) === selectedMonth);
  if (selectedDate) combinedList = combinedList.filter(e => e.date === selectedDate);

  const totalExpenses = combinedList
    .filter(e => e.type !== 'custody')
    .reduce((acc, e) => acc + (e.amount || 0), 0);

  totalCustodiesSpan.textContent = totalCustody;
  totalSpan.textContent = totalExpenses;
  remainingSpan.textContent = totalCustody - totalExpenses;

  renderFilteredExpenses(combinedList);
}

function renderFilteredExpenses(items) {
  expensesTable.innerHTML = '';
  items.forEach(e => {
    const row = document.createElement('tr');
    row.style.backgroundColor = e.type === 'custody' ? '#e0f7fa' : 'white';
    row.innerHTML = `
      <td>${e.date}</td>
      <td>${e.item}</td>
      <td>${e.amount}</td>
      <td>${e.note || ''}</td>
      <td>
        <span class="delete-btn" data-id="${e.id}" data-type="${e.type}">🗑️</span>
        <span class="edit-btn" data-id="${e.id}" data-type="${e.type}">✏️</span>
      </td>
    `;
    expensesTable.appendChild(row);

    row.querySelector('.delete-btn').onclick = async () => {
      const col = e.type === 'custody' ? 'custodies' : 'expenses';
      await deleteDoc(doc(db, col, e.id));
    };

    row.querySelector('.edit-btn').onclick = async () => {
      const newItem = prompt('اسم المصروف/العهدة:', e.item);
      const newAmount = +prompt('القيمة:', e.amount);
      const newNote = prompt('ملاحظة:', e.note || '');

      if (newItem && newAmount) {
        const col = e.type === 'custody' ? 'custodies' : 'expenses';
        const updateData = e.type === 'custody' ?
          { name: newItem, total_amount: newAmount, date: e.date } :
          { item: newItem, amount: newAmount, note: newNote, date: e.date };

        await updateDoc(doc(db, col, e.id), updateData);
      }
    };
  });
}
