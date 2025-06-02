export type ParamDefinition = {
  id: string;
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  default?: any;
  options?: any[];
  templateType?: string;
};

export type { JourneyActionType, DelayType } from './journey-actions'; 