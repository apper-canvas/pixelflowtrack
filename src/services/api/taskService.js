import { getApperClient } from "@/services/apperClient";
import { toast } from "react-toastify";

export const taskService = {
  async getAll() {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      const params = {
fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}}, 
          {"field": {"Name": "Tags"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "priority_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "images_c"}},
          {"field": {"Name": "CreatedOn"}},
          {"field": {"Name": "ModifiedOn"}}
        ],
        orderBy: [{"fieldName": "CreatedOn", "sorttype": "DESC"}]
      }

      const response = await apperClient.fetchRecords("task_c", params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        return []
      }

      // Transform data to match UI expectations
return response.data.map(task => ({
        Id: task.Id,
        title: task.title_c || task.Name || '',
        description: task.description_c || '',
        priority: task.priority_c || 'medium',
        status: task.status_c || 'active',
        tags: task.Tags || '',
        images: task.images_c || [],
        createdAt: task.CreatedOn,
        completedAt: task.status_c === 'completed' ? task.ModifiedOn : null
      }))
    } catch (error) {
      console.error("Error fetching tasks:", error?.response?.data?.message || error)
      toast.error("Failed to fetch tasks")
      return []
    }
  },

  async getById(id) {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      const params = {
fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}}, 
          {"field": {"Name": "Tags"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "priority_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "images_c"}},
          {"field": {"Name": "CreatedOn"}},
          {"field": {"Name": "ModifiedOn"}}
        ]
      }

      const response = await apperClient.getRecordById("task_c", parseInt(id), params)

      if (!response.success || !response.data) {
        throw new Error(`Task with Id ${id} not found`)
      }

// Transform data to match UI expectations
      const task = response.data
      return {
        Id: task.Id,
        title: task.title_c || task.Name || '',
        description: task.description_c || '',
        priority: task.priority_c || 'medium',
        status: task.status_c || 'active',
        tags: task.Tags || '',
        images: task.images_c || [],
        createdAt: task.CreatedOn,
        completedAt: task.status_c === 'completed' ? task.ModifiedOn : null
      }
    } catch (error) {
      console.error(`Error fetching task ${id}:`, error?.response?.data?.message || error)
      toast.error(`Failed to fetch task`)
      throw error
    }
  },

async create(taskData) {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      // Handle file data conversion if present
      let convertedFiles = [];
      if (taskData.images_c && taskData.images_c.length > 0 && window.ApperSDK?.ApperFileUploader) {
        try {
          convertedFiles = window.ApperSDK.ApperFileUploader.toCreateFormat(taskData.images_c);
        } catch (error) {
          console.error('Error converting files for creation:', error);
          // Continue with empty files array if conversion fails
        }
      }

      const params = {
        records: [{
          Name: taskData.title || taskData.title_c || 'Untitled Task',
          Tags: taskData.tags || '',
          title_c: taskData.title || taskData.title_c || '',
          description_c: taskData.description || taskData.description_c || '',
          priority_c: taskData.priority || taskData.priority_c || 'medium',
          status_c: taskData.status || taskData.status_c || 'active',
          ...(convertedFiles.length > 0 && { images_c: convertedFiles })
        }]
      }

      const response = await apperClient.createRecord("task_c", params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        throw new Error(response.message)
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success)
        const failed = response.results.filter(r => !r.success)
        
        if (failed.length > 0) {
          console.error(`Failed to create ${failed.length} records: ${JSON.stringify(failed)}`)
          failed.forEach(record => {
            if (record.errors) {
              record.errors.forEach(error => toast.error(`${error.fieldLabel}: ${error}`))
            }
            if (record.message) toast.error(record.message)
          })
        }

        if (successful.length > 0) {
          const newTask = successful[0].data
          toast.success("Task created successfully")
          
          // Transform response to match UI expectations  
return {
            Id: newTask.Id,
            title: newTask.title_c || newTask.Name || '',
            description: newTask.description_c || '',
            priority: newTask.priority_c || 'medium',
            status: newTask.status_c || 'active',
            tags: newTask.Tags || '',
            images: newTask.images_c || [],
            createdAt: newTask.CreatedOn,
            completedAt: newTask.status_c === 'completed' ? newTask.ModifiedOn : null
          }
        }
      }

      throw new Error("No successful records returned")
    } catch (error) {
      console.error("Error creating task:", error?.response?.data?.message || error)
      if (!error.message?.includes('Failed to create')) {
        toast.error("Failed to create task")
      }
      throw error
    }
  },

  async update(id, updates) {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      // Map UI field names to database field names
      const updateData = {
        Id: parseInt(id)
      }

      if (updates.title !== undefined) {
        updateData.Name = updates.title
        updateData.title_c = updates.title
      }
      if (updates.description !== undefined) {
        updateData.description_c = updates.description
      }
      if (updates.priority !== undefined) {
        updateData.priority_c = updates.priority
      }
      if (updates.status !== undefined) {
        updateData.status_c = updates.status
      }
      if (updates.tags !== undefined) {
        updateData.Tags = updates.tags
      }

      const params = {
        records: [updateData]
      }

      const response = await apperClient.updateRecord("task_c", params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        throw new Error(response.message)
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success)
        const failed = response.results.filter(r => !r.success)
        
        if (failed.length > 0) {
          console.error(`Failed to update ${failed.length} records: ${JSON.stringify(failed)}`)
          failed.forEach(record => {
            if (record.errors) {
              record.errors.forEach(error => toast.error(`${error.fieldLabel}: ${error}`))
            }
            if (record.message) toast.error(record.message)
          })
        }

        if (successful.length > 0) {
          const updatedTask = successful[0].data
          toast.success("Task updated successfully")
          
          // Transform response to match UI expectations
          return {
            Id: updatedTask.Id,
            title: updatedTask.title_c || updatedTask.Name || '',
            description: updatedTask.description_c || '',
            priority: updatedTask.priority_c || 'medium',
            status: updatedTask.status_c || 'active',
            tags: updatedTask.Tags || '',
            createdAt: updatedTask.CreatedOn,
            completedAt: updatedTask.status_c === 'completed' ? updatedTask.ModifiedOn : null
          }
        }
      }

      throw new Error("No successful records returned")
    } catch (error) {
      console.error(`Error updating task ${id}:`, error?.response?.data?.message || error)
      if (!error.message?.includes('Failed to update')) {
        toast.error("Failed to update task")
      }
      throw error
    }
  },

  async delete(id) {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      const params = {
        RecordIds: [parseInt(id)]
      }

      const response = await apperClient.deleteRecord("task_c", params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        return false
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success)
        const failed = response.results.filter(r => !r.success)
        
        if (failed.length > 0) {
          console.error(`Failed to delete ${failed.length} records: ${JSON.stringify(failed)}`)
          failed.forEach(record => {
            if (record.message) toast.error(record.message)
          })
        }

        if (successful.length > 0) {
          toast.success("Task deleted successfully")
          return true
        }
      }

      return false
} catch (error) {
      console.error(`Error deleting task ${id}:`, error?.response?.data?.message || error)
      toast.error("Failed to delete task")
      return false
    }
  }
}