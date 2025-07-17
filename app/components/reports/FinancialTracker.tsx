'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, DollarSign, TrendingUp, TrendingDown, Calendar,
  Filter, Search, Download, BarChart3, PieChart
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { recordFinancialTransaction } from '@/app/utils/api';
import toast from 'react-hot-toast';

interface FinancialTransaction {
  id?: string;
  leadId?: number;
  source: string;
  type: 'revenue' | 'cost' | 'refund' | 'adjustment';
  amount: number;
  description: string;
  relatedId?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}

interface FinancialTrackerProps {
  onTransactionAdded?: () => void;
}

export default function FinancialTracker({ onTransactionAdded }: FinancialTrackerProps) {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    source: '',
    dateRange: {
      start: '',
      end: ''
    }
  });

  const [newTransaction, setNewTransaction] = useState<FinancialTransaction>({
    source: '',
    type: 'revenue',
    amount: 0,
    description: '',
    relatedId: '',
    metadata: {}
  });

  const transactionTypes = [
    { value: 'revenue', label: 'Revenue', icon: TrendingUp, color: 'text-green-600' },
    { value: 'cost', label: 'Cost', icon: TrendingDown, color: 'text-red-600' },
    { value: 'refund', label: 'Refund', icon: TrendingDown, color: 'text-orange-600' },
    { value: 'adjustment', label: 'Adjustment', icon: TrendingUp, color: 'text-blue-600' }
  ];

  const handleAddTransaction = async () => {
    if (!newTransaction.source || !newTransaction.description || newTransaction.amount === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await recordFinancialTransaction(newTransaction);
      toast.success('Transaction recorded successfully');
      setShowAddModal(false);
      setNewTransaction({
        source: '',
        type: 'revenue',
        amount: 0,
        description: '',
        relatedId: '',
        metadata: {}
      });
      onTransactionAdded?.();
    } catch (error) {
      console.error('Error recording transaction:', error);
      toast.error('Failed to record transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    const transactionType = transactionTypes.find(t => t.value === type);
    return transactionType ? transactionType.icon : TrendingUp;
  };

  const getTransactionColor = (type: string) => {
    const transactionType = transactionTypes.find(t => t.value === type);
    return transactionType ? transactionType.color : 'text-gray-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateTotals = () => {
    const totals = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'revenue') {
        acc.revenue += transaction.amount;
      } else if (transaction.type === 'cost') {
        acc.costs += transaction.amount;
      } else if (transaction.type === 'refund') {
        acc.refunds += transaction.amount;
      }
      return acc;
    }, { revenue: 0, costs: 0, refunds: 0 });

    return {
      ...totals,
      profit: totals.revenue - totals.costs - totals.refunds,
      roi: totals.costs > 0 ? ((totals.revenue - totals.costs) / totals.costs) * 100 : 0
    };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Tracker</h2>
          <p className="text-gray-600">Track revenue, costs, and ROI for better insights</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          Add Transaction
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totals.revenue)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Costs</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totals.costs)}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totals.profit)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ROI</p>
              <p className={`text-2xl font-bold ${totals.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totals.roi.toFixed(1)}%
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="">All Types</option>
              {transactionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Filter by source"
              value={filters.source}
              onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.dateRange.start}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, start: e.target.value }
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.dateRange.end}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, end: e.target.value }
              }))}
            />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
            <p className="text-gray-600 mb-6">
              Start tracking your financial data by adding your first transaction
            </p>
            <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              Add First Transaction
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction, index) => {
                  const Icon = getTransactionIcon(transaction.type);
                  const colorClass = getTransactionColor(transaction.type);
                  
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Icon className={`w-4 h-4 mr-2 ${colorClass}`} />
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {transaction.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold ${colorClass}`}>
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.source}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={transaction.description}>
                          {transaction.description}
                        </div>
                        {transaction.relatedId && (
                          <div className="text-xs text-gray-500">
                            ID: {transaction.relatedId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Add Transaction</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction(prev => ({ 
                    ...prev, 
                    type: e.target.value as any 
                  }))}
                >
                  {transactionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="0.00"
                  value={newTransaction.amount || ''}
                  onChange={(e) => setNewTransaction(prev => ({ 
                    ...prev, 
                    amount: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Google Ads, Facebook, Direct"
                  value={newTransaction.source}
                  onChange={(e) => setNewTransaction(prev => ({ 
                    ...prev, 
                    source: e.target.value 
                  }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Describe this transaction..."
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Related ID (optional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., ORD-12345, Lead ID"
                  value={newTransaction.relatedId || ''}
                  onChange={(e) => setNewTransaction(prev => ({ 
                    ...prev, 
                    relatedId: e.target.value 
                  }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead ID (optional)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Lead ID if applicable"
                  value={newTransaction.leadId || ''}
                  onChange={(e) => setNewTransaction(prev => ({ 
                    ...prev, 
                    leadId: parseInt(e.target.value) || undefined 
                  }))}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 p-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddTransaction}
                disabled={isLoading}
              >
                {isLoading ? 'Adding...' : 'Add Transaction'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 