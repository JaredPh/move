import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import Header from '../components/Header'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { ExclamationCircleIcon } from '@heroicons/react/16/solid'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'

interface Location {
  id: string
  name: string
  user_id: string
  icon: string | null
  address: string
  archived: boolean
  created_at: string
  updated_at: string
}

interface Box {
  id: number
  location_id: string | null
  user_id: string
  open: boolean
  created_at: string
  updated_at: string
  size: string | null
  location?: Location
  items?: Item[]
  item_count?: number
}

interface Item {
  id: string
  box_id: number | null
  user_id: string
  fragile: boolean
  created_at: string
  updated_at: string
  name: string | null
  room: string | null
}

function Boxes() {
  const { user } = useAuth()
  const [boxes, setBoxes] = useState<Box[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedBox, setSelectedBox] = useState<Box | null>(null)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Helper function to check if a box contains fragile items
  const isBoxFragile = (box: Box) => {
    return box.items?.some(item => item.fragile) || false
  }

  // Helper function to format size display
  const formatSize = (size: string | null) => {
    if (!size) return 'Not specified'
    switch (size) {
      case 'small': return 'Small'
      case 'standard': return 'Standard'
      case 'large': return 'Large'
      default: return size
    }
  }

  // Helper function to get unique room emojis from items in a box
  const getRoomEmojis = (box: Box) => {
    if (!box.items || box.items.length === 0) return ''
    
    const uniqueRooms = [...new Set(box.items
      .map(item => item.room)
      .filter(room => room && room.trim() !== '')
    )]
    
    return uniqueRooms.join(' ')
  }

  useEffect(() => {
    if (user) {
      fetchBoxes()
      fetchLocations()
    }
  }, [user])

  const fetchBoxes = async () => {
    if (!user || !supabase) return

    const { data, error } = await supabase
      .from('boxes')
      .select(`
        *,
        location:locations(*),
        items(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching boxes:', error)
    } else {
      // Add item count to each box
      const boxesWithCounts = (data || []).map(box => ({
        ...box,
        item_count: box.items?.length || 0
      }))
      setBoxes(boxesWithCounts)
    }
    setLoading(false)
  }

  const fetchLocations = async () => {
    if (!user || !supabase) return

    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching locations:', error)
    } else {
      setLocations(data || [])
    }
  }

  const handleAddBox = () => {
    setDrawerOpen(true)
    setFormErrors({})
  }

  const handleViewBox = (box: Box) => {
    setSelectedBox(box)
    setViewDrawerOpen(true)
  }

  const handleEditBox = (box: Box) => {
    setSelectedBox(box)
    setFormErrors({})
    setViewDrawerOpen(false) // Close view drawer if open
    setEditDrawerOpen(true)
  }

  const clearFieldError = (fieldName: string) => {
    if (formErrors[fieldName]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const validateForm = (formData: FormData) => {
    const errors: { [key: string]: string } = {}
    
    const size = formData.get('box-size') as string
    
    if (!size) {
      errors['box-size'] = 'Box size is required'
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormErrors({})

    const formData = new FormData(e.currentTarget)
    const errors = validateForm(formData)
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setIsSubmitting(false)
      return
    }

    try {
      if (!user || !supabase) {
        throw new Error('User not authenticated or Supabase not initialized')
      }

      const locationId = formData.get('box-location') as string
      const size = formData.get('box-size') as string
      const open = formData.get('box-open') === 'on'

      const { data, error } = await supabase
        .from('boxes')
        .insert([
          {
            location_id: locationId || null,
            user_id: user.id,
            size: size,
            open
          }
        ])
        .select()

      if (error) {
        throw error
      }

      console.log('Box created successfully:', data)
      
      // Refresh the boxes list
      await fetchBoxes()
      
      // Close drawer on success
      setDrawerOpen(false)
      // Reset form
      e.currentTarget.reset()
    } catch (error) {
      console.error('Error adding box:', error)
      setFormErrors({ general: 'Failed to add box. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedBox) return
    
    setIsSubmitting(true)
    setFormErrors({})

    const formData = new FormData(e.currentTarget)
    const errors = validateForm(formData)
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setIsSubmitting(false)
      return
    }

    try {
      if (!user || !supabase) {
        throw new Error('User not authenticated or Supabase not initialized')
      }

      const locationId = formData.get('box-location') as string
      const size = formData.get('box-size') as string
      const open = formData.get('box-open') === 'on'

      const { data, error } = await supabase
        .from('boxes')
        .update({
          location_id: locationId || null,
          size: size,
          open
        })
        .eq('id', selectedBox.id)
        .select()

      if (error) {
        throw error
      }

      console.log('Box updated successfully:', data)
      
      // Refresh the boxes list
      await fetchBoxes()
      
      // Close drawer on success
      setEditDrawerOpen(false)
      setSelectedBox(null)
    } catch (error) {
      console.error('Error updating box:', error)
      setFormErrors({ general: 'Failed to update box. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Layout routeId="boxes">
      <Header button={{ label: 'Add box', onClick: handleAddBox }}>Boxes</Header>

      <div className="bg-gray-900">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg className="h-12 w-12 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-white">Loading boxes...</h3>
              <p className="mt-1 text-sm text-gray-400">Please wait while we fetch your boxes.</p>
            </div>
          </div>
        ) : boxes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-white">No boxes</h3>
              <p className="mt-1 text-sm text-gray-400">Get started by creating your first box.</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleAddBox}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  <svg className="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                  Add Box
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="mt-8 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-0">
                          ID
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                          Size
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                          Location
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                          Status
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                          Fragile
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-white">
                          Items
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                          Rooms
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                          <span className="sr-only">View</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {boxes.map((box) => (
                        <tr key={box.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-0 align-top">
                            #{box.id}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 align-top">
                            {formatSize(box.size)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 align-top">
                            {box.location?.name || 'Unassigned'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm align-top">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              box.open 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {box.open ? 'Open' : 'Closed'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 align-top">
                            {isBoxFragile(box) ? '🍷 Yes' : 'No'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 align-top text-center">
                            {box.item_count || 0}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-300 align-top">
                            <div className="flex flex-wrap gap-1">
                              {getRoomEmojis(box) || <span className="text-gray-500">-</span>}
                            </div>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0 align-top">
                            <button 
                              onClick={() => handleViewBox(box)}
                              className="text-indigo-400 hover:text-indigo-300"
                            >
                              View<span className="sr-only">, {box.id}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Box Drawer */}
      <Dialog open={drawerOpen} onClose={setDrawerOpen} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-500 ease-in-out data-[closed]:opacity-0"
        />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <DialogPanel
                transition
                className="pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out data-[closed]:translate-x-full sm:duration-700"
              >
                <form onSubmit={handleSubmit} className="flex h-full flex-col divide-y divide-gray-700 bg-gray-900 shadow-xl">
                  <div className="h-0 flex-1 overflow-y-auto">
                    <div className="bg-indigo-700 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <DialogTitle className="text-base font-semibold text-white">Add Box</DialogTitle>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            onClick={() => setDrawerOpen(false)}
                            className="relative rounded-md bg-indigo-700 text-indigo-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon aria-hidden="true" className="size-6" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-indigo-300">
                          Create a new box to organize your items.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="divide-y divide-gray-700 px-4 sm:px-6">
                        <div className="space-y-6 pb-5 pt-6">
                          <fieldset>
                            <legend className="block text-sm/6 font-medium text-gray-300">Size</legend>
                            <div className="mt-2 grid grid-cols-3 gap-3">
                              {[
                                { id: 'small', name: '📦 Small' },
                                { id: 'standard', name: '📦 Standard' },
                                { id: 'large', name: '📦 Large' }
                              ].map((option) => (
                                <label
                                  key={option.id}
                                  aria-label={option.name}
                                  className={`group relative flex items-center justify-center rounded-md border p-3 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-600 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo-600 ${formErrors['box-size']
                                    ? 'border-red-500 bg-red-900/20'
                                    : 'border-gray-600 bg-gray-800'
                                    }`}
                                >
                                  <input
                                    defaultValue={option.id}
                                    name="box-size"
                                    type="radio"
                                    onChange={() => clearFieldError('box-size')}
                                    className="absolute inset-0 appearance-none focus:outline focus:outline-0"
                                  />
                                  <span className="text-sm font-medium group-has-[:checked]:text-white text-gray-300">{option.name}</span>
                                </label>
                              ))}
                            </div>
                            {formErrors['box-size'] && (
                              <p className="mt-2 text-sm text-red-400">
                                {formErrors['box-size']}
                              </p>
                            )}
                          </fieldset>
                          
                          <div>
                            <label htmlFor="box-location" className="block text-sm/6 font-medium text-gray-300">
                              Location
                            </label>
                            <div className="mt-2">
                              <select
                                id="box-location"
                                name="box-location"
                                className="block w-full rounded-md bg-gray-800 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
                              >
                                <option value="">Unassigned</option>
                                {locations.map((location) => (
                                  <option key={location.id} value={location.id}>
                                    {location.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="relative flex items-start">
                              <div className="flex h-6 items-center">
                                <input
                                  id="box-open"
                                  name="box-open"
                                  type="checkbox"
                                  defaultChecked
                                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-600"
                                />
                              </div>
                              <div className="ml-3 text-sm leading-6">
                                <label htmlFor="box-open" className="font-medium text-gray-300">
                                  Box is open
                                </label>
                                <p className="text-gray-400">Mark this if the box is currently open for packing.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col px-4 py-4">
                    {formErrors.general && (
                      <div className="mb-4 rounded-md bg-red-900/20 p-3">
                        <div className="flex">
                          <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                          <div className="ml-3">
                            <p className="text-sm text-red-400">{formErrors.general}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setDrawerOpen(false)}
                        disabled={isSubmitting}
                        className="rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="ml-4 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Adding...' : 'Add Box'}
                      </button>
                    </div>
                  </div>
                </form>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>

      {/* View Box Drawer */}
      <Dialog open={viewDrawerOpen} onClose={setViewDrawerOpen} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-500 ease-in-out data-[closed]:opacity-0"
        />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <DialogPanel
                transition
                className="pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out data-[closed]:translate-x-full sm:duration-700"
              >
                <div className="flex h-full flex-col divide-y divide-gray-700 bg-gray-900 shadow-xl">
                  <div className="h-0 flex-1 overflow-y-auto">
                    <div className="bg-indigo-700 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <DialogTitle className="text-base font-semibold text-white">
                          Box #{selectedBox?.id}
                        </DialogTitle>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            onClick={() => setViewDrawerOpen(false)}
                            className="relative rounded-md bg-indigo-700 text-indigo-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon aria-hidden="true" className="size-6" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-indigo-300">
                          Box details and contained items.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="px-4 sm:px-6">
                        <div className="space-y-6 pb-5 pt-6">
                          <div>
                            <h3 className="text-sm/6 font-medium text-gray-300">Box Information</h3>
                            <dl className="mt-2 divide-y divide-gray-700">
                              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-400">ID</dt>
                                <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">#{selectedBox?.id}</dd>
                              </div>
                              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-400">Size</dt>
                                <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                  {formatSize(selectedBox?.size || null)}
                                </dd>
                              </div>
                              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-400">Location</dt>
                                <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                  {selectedBox?.location?.name || 'Unassigned'}
                                </dd>
                              </div>
                              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-400">Status</dt>
                                <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                  {selectedBox?.open ? 'Open' : 'Closed'}
                                </dd>
                              </div>
                              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-400">Fragile</dt>
                                <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                  {selectedBox && isBoxFragile(selectedBox) ? 'Yes 🍷' : 'No'}
                                </dd>
                              </div>
                              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-400">Rooms</dt>
                                <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                  <div className="flex flex-wrap gap-1">
                                    {selectedBox && getRoomEmojis(selectedBox) || <span className="text-gray-500">No items yet</span>}
                                  </div>
                                </dd>
                              </div>
                              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-400">Created</dt>
                                <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                  {selectedBox?.created_at && new Date(selectedBox.created_at).toLocaleDateString()}
                                </dd>
                              </div>
                            </dl>
                          </div>
                          
                          <div>
                            <h3 className="text-sm/6 font-medium text-gray-300">Items ({selectedBox?.items?.length || 0})</h3>
                            {selectedBox?.items && selectedBox.items.length > 0 ? (
                              <div className="mt-2 space-y-3">
                                {selectedBox.items.map((item) => (
                                  <div key={item.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className="text-xl">
                                          {item.fragile ? '🍷' : '📦'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-medium text-white truncate">
                                            {item.name || `Item ${item.id.substring(0, 8)}`}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex space-x-2">
                                        {item.room && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-800">
                                            {item.room}
                                          </span>
                                        )}
                                        {item.fragile && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-900/50 text-orange-300 border border-orange-800">
                                            Fragile
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="mt-2 text-center py-8">
                                <div className="mx-auto h-12 w-12 text-gray-400">
                                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                </div>
                                <p className="mt-2 text-sm text-gray-400">No items yet</p>
                                <p className="text-sm text-gray-500">Items will appear here when added to this box</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 justify-between px-4 py-4">
                    <button
                      type="button"
                      onClick={() => selectedBox && handleEditBox(selectedBox)}
                      className="rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-700 hover:text-white"
                    >
                      Edit Box
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewDrawerOpen(false)}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Edit Box Drawer */}
      <Dialog open={editDrawerOpen} onClose={setEditDrawerOpen} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-500 ease-in-out data-[closed]:opacity-0"
        />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <DialogPanel
                transition
                className="pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out data-[closed]:translate-x-full sm:duration-700"
              >
                <form onSubmit={handleEditSubmit} className="flex h-full flex-col divide-y divide-gray-700 bg-gray-900 shadow-xl">
                  <div className="h-0 flex-1 overflow-y-auto">
                    <div className="bg-indigo-700 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <DialogTitle className="text-base font-semibold text-white">Edit Box</DialogTitle>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            onClick={() => setEditDrawerOpen(false)}
                            className="relative rounded-md bg-indigo-700 text-indigo-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon aria-hidden="true" className="size-6" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-indigo-300">
                          Update your box information.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="divide-y divide-gray-700 px-4 sm:px-6">
                        <div className="space-y-6 pb-5 pt-6">
                          <fieldset>
                            <legend className="block text-sm/6 font-medium text-gray-300">Size</legend>
                            <div className="mt-2 grid grid-cols-3 gap-3">
                              {[
                                { id: 'small', name: '📦 Small' },
                                { id: 'standard', name: '📦 Standard' },
                                { id: 'large', name: '📦 Large' }
                              ].map((option) => (
                                <label
                                  key={option.id}
                                  aria-label={option.name}
                                  className={`group relative flex items-center justify-center rounded-md border p-3 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-600 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo-600 ${formErrors['box-size']
                                    ? 'border-red-500 bg-red-900/20'
                                    : 'border-gray-600 bg-gray-800'
                                    }`}
                                >
                                  <input
                                    defaultValue={option.id}
                                    defaultChecked={selectedBox?.size === option.id}
                                    name="box-size"
                                    type="radio"
                                    onChange={() => clearFieldError('box-size')}
                                    className="absolute inset-0 appearance-none focus:outline focus:outline-0"
                                  />
                                  <span className="text-sm font-medium group-has-[:checked]:text-white text-gray-300">{option.name}</span>
                                </label>
                              ))}
                            </div>
                            {formErrors['box-size'] && (
                              <p className="mt-2 text-sm text-red-400">
                                {formErrors['box-size']}
                              </p>
                            )}
                          </fieldset>
                          
                          <div>
                            <label htmlFor="edit-box-location" className="block text-sm/6 font-medium text-gray-300">
                              Location
                            </label>
                            <div className="mt-2">
                              <select
                                id="edit-box-location"
                                name="box-location"
                                defaultValue={selectedBox?.location_id || ''}
                                className="block w-full rounded-md bg-gray-800 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
                              >
                                <option value="">Unassigned</option>
                                {locations.map((location) => (
                                  <option key={location.id} value={location.id}>
                                    {location.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="relative flex items-start">
                              <div className="flex h-6 items-center">
                                <input
                                  id="edit-box-open"
                                  name="box-open"
                                  type="checkbox"
                                  defaultChecked={selectedBox?.open}
                                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-600"
                                />
                              </div>
                              <div className="ml-3 text-sm leading-6">
                                <label htmlFor="edit-box-open" className="font-medium text-gray-300">
                                  Box is open
                                </label>
                                <p className="text-gray-400">Mark this if the box is currently open for packing.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col px-4 py-4">
                    {formErrors.general && (
                      <div className="mb-4 rounded-md bg-red-900/20 p-3">
                        <div className="flex">
                          <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                          <div className="ml-3">
                            <p className="text-sm text-red-400">{formErrors.general}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setEditDrawerOpen(false)}
                        disabled={isSubmitting}
                        className="rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="ml-4 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>
    </Layout >

  )
}

export default Boxes