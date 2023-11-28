export function Breadcrumbs({ folders }) {
  return folders?.map((folder) => <span key={folder}>{folder}</span>);
}
