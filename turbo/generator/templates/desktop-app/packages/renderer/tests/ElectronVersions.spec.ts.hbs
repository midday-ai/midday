import {mount} from '@vue/test-utils';
import {expect, test, vi} from 'vitest';
import ElectronVersions from '../src/components/ElectronVersions.vue';

vi.mock('#preload', () => {
  return {
    versions: {lib1: 1, lib2: 2},
  };
});

test('ElectronVersions component', async () => {
  expect(ElectronVersions).toBeTruthy();
  const wrapper = mount(ElectronVersions);

  const rows = wrapper.findAll<HTMLTableRowElement>('tr');
  expect(rows.length).toBe(2);

  expect(rows[0].find('th').text()).toBe('lib1 :');
  expect(rows[0].find('td').text()).toBe('v1');

  expect(rows[1].find('th').text()).toBe('lib2 :');
  expect(rows[1].find('td').text()).toBe('v2');
});
