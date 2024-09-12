import { ProviderConfigs } from '../types';
import TritonAPIConfig from './api';
import {
  TritonCompleteConfig,
  TritonCompleteResponseTransform,
} from './complete';

const TritonConfig: ProviderConfigs = {
  api: TritonAPIConfig,
  complete: TritonCompleteConfig,
  responseTransforms: {
    complete: TritonCompleteResponseTransform,
  },
};

export default TritonConfig;
