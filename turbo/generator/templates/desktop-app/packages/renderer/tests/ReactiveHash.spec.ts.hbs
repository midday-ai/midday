import {mount} from '@vue/test-utils';
import {expect, test, vi} from 'vitest';
import ReactiveHash from '../src/components/ReactiveHash.vue';

vi.mock('#preload', () => {
  return {
    sha256sum: vi.fn((s: string) => `${s}:HASHED`),
  };
});

test('ReactiveHash component', async () => {
  expect(ReactiveHash).toBeTruthy();
  const wrapper = mount(ReactiveHash);

  const dataInput = wrapper.get<HTMLInputElement>('input:not([readonly])');
  const hashInput = wrapper.get<HTMLInputElement>('input[readonly]');

  const dataToHashed = Math.random().toString(36).slice(2, 7);
  await dataInput.setValue(dataToHashed);
  expect(hashInput.element.value).toBe(`${dataToHashed}:HASHED`);
});
