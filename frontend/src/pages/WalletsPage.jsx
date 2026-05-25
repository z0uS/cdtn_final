// pages/WalletsPage.jsx
// Quản lý ví/tài khoản: CRUD + chuyển tiền + tổng số dư

import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ArrowRightLeft, Wallet, CreditCard, Smartphone, Building2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import useTransactionStore from '../store/transactionStore';
import { createTransferApi } from '../api/transferApi';
import { formatCurrency }  from '../utils/formatCurrency';
import { sumBy }           from '../utils/calcPercent';
import AmountInput         from '../components/ui/AmountInput';
import Button              from '../components/ui/Button';
import Modal               from '../components/ui/Modal';
import ConfirmDialog       from '../components/ui/ConfirmDialog';

const WALLET_ICONS = ['Wallet', 'CreditCard', 'Smartphone', 'Building2', 'Banknote', 'PiggyBank'];
const WALLET_COLORS = ['#f59e0b','#2563eb','#a855f7','#0ea5e9','#10b981','#ef4444','#64748b'];

const walletSchema = yup.object({
  name:    yup.string().min(2,'Tên ít nhất 2 ký tự').required('Nhập tên ví'),
  icon:    yup.string().required('Chọn icon'),
  color:   yup.string().required('Chọn màu'),
  balance: yup.number().min(0,'Số dư không âm').required('Nhập số dư'),
});

const transferSchema = yup.object({
  fromWalletId: yup.string().required('Chọn ví nguồn'),
  toWalletId:   yup.string()
    .notOneOf([yup.ref('fromWalletId')], 'Ví đích phải khác ví nguồn')
    .required('Chọn ví đích'),
  amount: yup.number().min(1000,'Tối thiểu 1.000₫').required('Nhập số tiền'),
  note:   yup.string(),
});

const WalletsPage = () => {
  const { wallets, addWallet, updateWallet, deleteWallet, fetchAllData } = useTransactionStore();

  const [walletModal,   setWalletModal]   = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [editData,      setEditData]      = useState(null);
  const [deleteId,      setDeleteId]      = useState(null);
  const [selIcon,       setSelIcon]       = useState('Wallet');
  const [selColor,      setSelColor]      = useState('#f59e0b');

  const total = useMemo(() => sumBy(wallets, 'balance'), [wallets]);

  const pieData = wallets.map((w, i) => ({
    name:  w.name,
    value: w.balance,
    color: w.color || WALLET_COLORS[i % WALLET_COLORS.length],
  }));

  // Wallet form
  const {
    register: regW, handleSubmit: handleW, control: ctrlW, reset: resetW, setValue: setValW,
    formState: { errors: errW, isSubmitting: subW },
  } = useForm({ resolver: yupResolver(walletSchema) });

  // Transfer form
  const {
    register: regT, handleSubmit: handleT, control: ctrlT, reset: resetT,
    formState: { errors: errT, isSubmitting: subT },
  } = useForm({ resolver: yupResolver(transferSchema) });

  const openAdd = () => {
    setEditData(null);
    setSelIcon('Wallet');
    setSelColor('#f59e0b');
    resetW({ name: '', icon: 'Wallet', color: '#f59e0b', balance: 0 });
    setWalletModal(true);
  };
  const openEdit = (w) => {
    setEditData(w);
    setSelIcon(w.icon);
    setSelColor(w.color);
    resetW({ name: w.name, icon: w.icon, color: w.color, balance: w.balance });
    setWalletModal(true);
  };

  const onWalletSubmit = async (data) => {
    try {
      if (editData) {
        await updateWallet(editData.id, data);
        toast.success('Đã cập nhật ví');
      } else {
        await addWallet(data);
        toast.success('Đã thêm ví mới');
      }
      setWalletModal(false);
    } catch (err) {
      toast.error('Có lỗi xảy ra, thử lại sau');
    }
  };

  const onTransferSubmit = async (data) => {
    const fromWallet = wallets.find((w) => w.id === parseInt(data.fromWalletId) || w.id === data.fromWalletId);
    if (!fromWallet || fromWallet.balance < data.amount) {
      toast.error('Số dư ví nguồn không đủ');
      return;
    }
    try {
      await createTransferApi({
        from_account_id: parseInt(data.fromWalletId),
        to_account_id: parseInt(data.toWalletId),
        amount: data.amount,
        fee: 0,
        transfer_date: new Date().toISOString().slice(0, 10),
        note: data.note || ''
      });
      // Cập nhật lại toàn bộ dữ liệu vì ví và giao dịch đều bị ảnh hưởng
      await fetchAllData();
      toast.success('Chuyển tiền thành công!');
      setTransferModal(false);
      resetT();
    } catch (err) {
      toast.error('Có lỗi xảy ra, thử lại sau');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Ví & Tài khoản</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={ArrowRightLeft} onClick={() => setTransferModal(true)}>
            Chuyển tiền
          </Button>
          <Button icon={Plus} size="sm" onClick={openAdd}>Thêm ví</Button>
        </div>
      </div>

      {/* Total + Pie chart */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5 flex flex-col justify-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Tổng số dư</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{formatCurrency(total)}</p>
          <p className="text-xs text-slate-400 mt-1">{wallets.length} ví / tài khoản</p>
        </div>
        <div className="card p-5">
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={55} dataKey="value" paddingAngle={2}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color || WALLET_COLORS[i % WALLET_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8}
                formatter={(val) => <span style={{ fontSize: 11, color: '#64748b' }}>{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Wallet cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {wallets.map((w) => {
          const percent = total > 0 ? Math.round((w.balance / total) * 100) : 0;
          return (
            <div key={w.id} className="card p-5 relative group hover:shadow-card-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: (w.color || '#f59e0b') + '20' }}
                >
                  {(() => {
                    const I = { Wallet, CreditCard, Smartphone, Building2 }[w.icon] || Wallet;
                    return <I className="w-5 h-5" style={{ color: w.color || '#f59e0b' }} />;
                  })()}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(w)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(w.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-expense-600 hover:bg-expense-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{w.name}</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(w.balance)}</p>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Tỷ lệ</span><span>{percent}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percent}%`, background: w.color || '#f59e0b' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Wallet Modal */}
      <Modal
        isOpen={walletModal}
        onClose={() => setWalletModal(false)}
        title={editData ? 'Sửa ví' : 'Thêm ví mới'}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setWalletModal(false)}>Hủy</Button>
            <Button loading={subW} onClick={handleW(onWalletSubmit)}>Lưu</Button>
          </div>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tên ví *</label>
            <input type="text" placeholder="VD: Tiền mặt, Vietcombank..." {...regW('name')} className="input-base" />
            {errW.name && <p className="mt-1 text-xs text-expense-600">{errW.name.message}</p>}
          </div>
          <Controller
            name="balance" control={ctrlW}
            render={({ field }) => (
              <AmountInput label="Số dư hiện tại *" value={field.value} onChange={field.onChange} error={errW.balance?.message} />
            )}
          />
          {/* Icon + Color row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Icon</label>
              <div className="grid grid-cols-3 gap-1.5">
                {WALLET_ICONS.map((name) => {
                  const I = { Wallet, CreditCard, Smartphone, Building2 }[name] || Wallet;
                  return (
                    <button key={name} type="button"
                      onClick={() => { setSelIcon(name); setValW('icon', name); }}
                      className={`p-2 rounded-xl flex items-center justify-center border-2 transition-all ${selIcon === name ? 'border-primary-500 bg-primary-50' : 'border-transparent bg-slate-50 dark:bg-slate-800'}`}
                    >
                      <I className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Màu sắc</label>
              <div className="grid grid-cols-4 gap-1.5">
                {WALLET_COLORS.map((c) => (
                  <button key={c} type="button"
                    onClick={() => { setSelColor(c); setValW('color', c); }}
                    className={`w-8 h-8 rounded-full transition-all ${selColor === c ? 'ring-2 ring-primary-500 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        isOpen={transferModal}
        onClose={() => { setTransferModal(false); resetT(); }}
        title="Chuyển tiền giữa ví"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setTransferModal(false)}>Hủy</Button>
            <Button loading={subT} onClick={handleT(onTransferSubmit)}>Chuyển tiền</Button>
          </div>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Ví nguồn *</label>
            <select {...regT('fromWalletId')} className="select-base">
              <option value="">-- Chọn ví nguồn --</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
              ))}
            </select>
            {errT.fromWalletId && <p className="mt-1 text-xs text-expense-600">{errT.fromWalletId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Ví đích *</label>
            <select {...regT('toWalletId')} className="select-base">
              <option value="">-- Chọn ví đích --</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
              ))}
            </select>
            {errT.toWalletId && <p className="mt-1 text-xs text-expense-600">{errT.toWalletId.message}</p>}
          </div>
          <Controller
            name="amount" control={ctrlT}
            render={({ field }) => (
              <AmountInput label="Số tiền chuyển *" value={field.value} onChange={field.onChange} error={errT.amount?.message} />
            )}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Ghi chú</label>
            <input type="text" placeholder="Ghi chú (tùy chọn)" {...regT('note')} className="input-base" />
          </div>
        </form>
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          try {
            await deleteWallet(deleteId);
            toast.success('Đã xóa ví');
            setDeleteId(null);
          } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể xóa ví này!');
            setDeleteId(null);
          }
        }}
        title="Xóa ví"
        message="Ví sẽ bị xóa. Các giao dịch liên quan không bị xóa. Bạn có chắc chắn?"
      />
    </div>
  );
};

export default WalletsPage;
