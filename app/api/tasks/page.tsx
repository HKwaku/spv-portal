import Link from 'next/link';
import { getMyTasks } from '@/lib/todos-query';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  // Temporary stub until auth is added
  const userEmail = 'hope.tettey@gmail.com';
  const teams = ['fund_ops', 'tax_team', 'tpa', 'fund_counsel', 'gems_team'];

  const tasks = await getMyTasks(userEmail, teams);

  return (
    <div className="card">
      <div className="card-header">
        <h1 className="card-title">My tasks</h1>
      </div>

      {tasks.length === 0 ? (
        <p className="muted">No open tasks.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Entity</th>
                <th>Task</th>
                <th>Owner</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.entityName}</td>
                  <td>{task.stepTitle}</td>
                  <td>{task.owner}</td>
                  <td>{task.status}</td>
                  <td>
                    <Link href={`/runs/${task.runId}`} className="btn btn-primary btn-sm">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}