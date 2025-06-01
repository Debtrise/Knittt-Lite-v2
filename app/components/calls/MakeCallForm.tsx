import React from 'react';
import { Input } from '@/app/components/ui/Input';
import Button from '@/app/components/ui/button';
import { UseFormRegister, FieldErrors, SubmitHandler, UseFormHandleSubmit } from 'react-hook-form';

type CallFormData = {
  to: string;
  transfer_number: string;
  from: string;
  trunk?: string;
  context?: string;
  leadId?: number;
  exten?: string;
  priority?: number;
  timeout?: number;
  async?: string;
  variables?: Record<string, string>;
};

type DID = {
  id: number;
  phoneNumber: string;
  description: string;
  isActive: boolean;
};

type MakeCallFormProps = {
  dids: DID[];
  onSubmit: SubmitHandler<CallFormData>;
  handleSubmit: UseFormHandleSubmit<CallFormData>;
  isLoading: boolean;
  errors: FieldErrors<CallFormData>;
  register: UseFormRegister<CallFormData>;
};

const MakeCallForm: React.FC<MakeCallFormProps> = ({ dids, onSubmit, handleSubmit, isLoading, errors, register }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="to" className="block text-sm font-medium text-gray-700">
          To Number
        </label>
        <Input
          id="to"
          type="tel"
          {...register('to', { required: 'Phone number is required' })}
          className="mt-1"
          placeholder="Enter phone number"
        />
        {errors.to && (
          <p className="mt-1 text-sm text-red-500">{errors.to.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="from" className="block text-sm font-medium text-gray-700">
          From Number
        </label>
        <select
          id="from"
          {...register('from', { required: 'From number is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select a number</option>
          {dids.map((did) => (
            <option key={did.id} value={did.phoneNumber}>
              {did.phoneNumber} - {did.description}
            </option>
          ))}
        </select>
        {errors.from && (
          <p className="mt-1 text-sm text-red-500">{errors.from.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="transfer_number" className="block text-sm font-medium text-gray-700">
          Transfer Number (Optional)
        </label>
        <Input
          id="transfer_number"
          type="tel"
          {...register('transfer_number')}
          className="mt-1"
          placeholder="Enter transfer number"
        />
      </div>

      <div>
        <label htmlFor="leadId" className="block text-sm font-medium text-gray-700">
          Lead ID (Optional)
        </label>
        <Input
          id="leadId"
          type="number"
          {...register('leadId')}
          className="mt-1"
          placeholder="Enter lead ID"
        />
      </div>

      <div>
        <label htmlFor="trunk" className="block text-sm font-medium text-gray-700">
          Trunk (Optional)
        </label>
        <Input
          id="trunk"
          type="text"
          {...register('trunk')}
          className="mt-1"
          placeholder="Enter trunk"
        />
      </div>

      <div>
        <label htmlFor="context" className="block text-sm font-medium text-gray-700">
          Context (Optional)
        </label>
        <Input
          id="context"
          type="text"
          {...register('context')}
          className="mt-1"
          placeholder="Enter context"
        />
      </div>

      <div>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Making Call...' : 'Make Call'}
        </Button>
      </div>
    </form>
  </div>
);

export default MakeCallForm; 