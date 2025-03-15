import React from "react";
import {TaskType} from "../../types/task.type.ts";


type EditFormProps = {
  editTask: (e: React.FormEvent) => void;
  setTask: <K extends keyof TaskType>({field, fieldValue}: { field: K; fieldValue: TaskType[K] }) => void;
  closeModal: () => void;
  task: TaskType;
  statuses: { value: string; label: string }[];
}

const EditForm = ({editTask, setTask, closeModal, task, statuses}: EditFormProps) => {
  return (
    <>
      <form onSubmit={editTask} className="modal-form">
        <div className="form-group">
          <input
            type="text"
            placeholder="Title"
            value={task.title}
            onChange={(e) => setTask({field: "title", fieldValue: e.target.value})}
          />
        </div>
        <textarea
          placeholder="Description"
          value={task.description}
          onChange={(e) => setTask({field: "description", fieldValue: e.target.value})}
        />
        <select value={task.status} onChange={(e) => setTask({field: "status", fieldValue: e.target.value})}>
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <div className="modal-actions">
          <button type="submit">Update Task</button>
          <button type="button" onClick={closeModal}>
            Cancel
          </button>
        </div>
      </form>
    </>
  )
}

export default EditForm;