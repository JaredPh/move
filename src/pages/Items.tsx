import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import Header from '../components/Header'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { ExclamationCircleIcon } from '@heroicons/react/16/solid'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'

interface Box {
  id: number
  location_id: string | null
  user_id: string
  open: boolean
  created_at: string
  updated_at: string
  size: string | null
  fragile: boolean
  location?: Location
}

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

interface Item {
  id: string
  box_id: number | null
  user_id: string
  fragile: boolean
  created_at: string
  updated_at: string
  name: string | null
  room: string | null
  box?: Box
}

function Items() {
  const { user } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [boxes, setBoxes] = useState<Box[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Helper function to format room display
  const formatRoom = (room: string | null) => {
    if (!room) return '🤷 None'
    switch (room) {
      case 'kitchen': return '🍳 Kitchen'
      case 'lounge': return '🛋️ Lounge'
      case 'balcony': return '🌿 Balcony'
      case 'bedroom': return '🛏️ Bedroom'
      case 'office': return '💻 Office'
      case 'bathroom': return '🚿 Bathroom'
      case 'hallway': return '🚪 Hallway'
      case 'storage': return '📦 Storage'
      default: return '🤷 None'
    }
  }

  // Filter items based on search query
  const filteredItems = items.filter(item => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    const itemName = (item.name || '').toLowerCase()
    const roomName = formatRoom(item.room).toLowerCase()
    const boxName = item.box ? `box #${item.box.id}` : 'unassigned'
    const locationName = (item.box?.location?.name || 'no location').toLowerCase()
    
    return itemName.includes(query) || 
           roomName.includes(query) || 
           boxName.includes(query) ||
           locationName.includes(query)
  })

  useEffect(() => {
    if (user) {
      fetchItems()
      fetchBoxes()
    }
  }, [user])

  const fetchItems = async () => {
    if (!user || !supabase) return

    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        box:boxes(*, location:locations(*))
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching items:', error)
    } else {
      setItems(data || [])
    }
    setLoading(false)
  }

  const fetchBoxes = async () => {
    if (!user || !supabase) return

    const { data, error } = await supabase
      .from('boxes')
      .select(`
        *,
        location:locations(*)
      `)
      .eq('user_id', user.id)
      .order('id', { ascending: true })

    if (error) {
      console.error('Error fetching boxes:', error)
    } else {
      setBoxes(data || [])
    }
  }

  const handleAddItem = () => {
    setDrawerOpen(true)
    setFormErrors({})
  }

  const handleViewItem = (item: Item) => {
    setSelectedItem(item)
    setViewDrawerOpen(true)
  }

  const handleEditItem = (item: Item) => {
    setSelectedItem(item)
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

    const name = formData.get('item-name') as string
    const room = formData.get('item-room') as string

    if (!name || name.trim().length === 0) {
      errors['item-name'] = 'Item name is required'
    } else if (name.trim().length < 2) {
      errors['item-name'] = 'Item name must be at least 2 characters'
    }

    if (!room) {
      errors['item-room'] = 'Room is required'
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

      const boxId = formData.get('item-box') as string
      const name = formData.get('item-name') as string
      const room = formData.get('item-room') as string
      const fragile = formData.get('item-fragile') === 'on'

      const { data, error } = await supabase
        .from('items')
        .insert([
          {
            box_id: boxId ? parseInt(boxId) : null,
            user_id: user.id,
            name: name.trim(),
            room: room === 'None' ? null : room,
            fragile
          }
        ])
        .select()

      if (error) {
        throw error
      }

      console.log('Item created successfully:', data)

      // Refresh the items list
      await fetchItems()

      // Close drawer on success
      setDrawerOpen(false)
      // Reset form
      e.currentTarget.reset()
    } catch (error) {
      console.error('Error adding item:', error)
      setFormErrors({ general: 'Failed to add item. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedItem) return

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

      const boxId = formData.get('item-box') as string
      const name = formData.get('item-name') as string
      const room = formData.get('item-room') as string
      const fragile = formData.get('item-fragile') === 'on'

      const { data, error } = await supabase
        .from('items')
        .update({
          box_id: boxId ? parseInt(boxId) : null,
          name: name.trim(),
          room: room === 'None' ? null : room,
          fragile
        })
        .eq('id', selectedItem.id)
        .select()

      if (error) {
        throw error
      }

      console.log('Item updated successfully:', data)

      // Refresh the items list
      await fetchItems()

      // Close drawer on success
      setEditDrawerOpen(false)
      setSelectedItem(null)
    } catch (error) {
      console.error('Error updating item:', error)
      setFormErrors({ general: 'Failed to update item. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Layout routeId="items">
      <Header button={{ label: 'Add item', onClick: handleAddItem }}>Items</Header>

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
              <h3 className="mt-2 text-sm font-semibold text-white">Loading items...</h3>
              <p className="mt-1 text-sm text-gray-400">Please wait while we fetch your items.</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-white">No items</h3>
              <p className="mt-1 text-sm text-gray-400">Get started by creating your first item.</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  <svg className="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                  Add Item
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Search Bar */}
            <div className="mt-6">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="search"
                  placeholder="Search items by name, room, box, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full rounded-md bg-gray-800 py-2 pl-10 pr-3 text-sm text-white placeholder:text-gray-400 outline outline-1 -outline-offset-1 outline-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600"
                />
                {searchQuery && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-gray-400 hover:text-white"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              {searchQuery && (
                <p className="mt-2 text-sm text-gray-400">
                  {filteredItems.length} of {items.length} items
                </p>
              )}
            </div>

            {filteredItems.length === 0 ? (
              <div className="mt-8 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <MagnifyingGlassIcon className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-semibold text-white">No items found</h3>
                <p className="mt-1 text-sm text-gray-400">
                  {searchQuery ? 'Try adjusting your search terms.' : 'No items to display.'}
                </p>
                {searchQuery && (
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-0">
                          Name
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                          Room
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                          Box
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                          Location
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                          <span className="sr-only">View</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredItems.map((item) => (
                        <tr key={item.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-0 align-top">
                            {(item.name || 'Unnamed item')}{item.fragile ? ' 🍷' : ''}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 align-top">
                            {formatRoom(item.room)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 align-top">
                            {item.box ? `Box #${item.box.id}` : 'Unassigned'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 align-top">
                            {item.box?.location?.name || 'No location'}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0 align-top">
                            <button
                              onClick={() => handleViewItem(item)}
                              className="text-indigo-400 hover:text-indigo-300"
                            >
                              View<span className="sr-only">, {item.name}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Item Drawer */}
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
                        <DialogTitle className="text-base font-semibold text-white">Add Item</DialogTitle>
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
                          Create a new item to organize your belongings.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="divide-y divide-gray-700 px-4 sm:px-6">
                        <div className="space-y-6 pb-5 pt-6">
                          <div>
                            <label htmlFor="item-name" className="block text-sm/6 font-medium text-gray-300">
                              Name
                            </label>
                            <div className="mt-2 grid grid-cols-1">
                              <input
                                id="item-name"
                                name="item-name"
                                type="text"
                                aria-invalid={formErrors['item-name'] ? 'true' : 'false'}
                                aria-describedby={formErrors['item-name'] ? 'item-name-error' : undefined}
                                onChange={() => clearFieldError('item-name')}
                                className={`col-start-1 row-start-1 block w-full rounded-md px-3 py-1.5 text-base outline outline-1 -outline-offset-1 placeholder:text-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 sm:text-sm/6 ${formErrors['item-name']
                                  ? 'bg-red-900/20 text-red-100 outline-red-500 placeholder:text-red-400 focus-visible:outline-red-500 pr-10'
                                  : 'bg-gray-800 text-white outline-gray-600 focus-visible:outline-indigo-600'
                                  }`}
                                placeholder="e.g., Winter jacket, Coffee mug, Books"
                              />
                              {formErrors['item-name'] && (
                                <ExclamationCircleIcon
                                  aria-hidden="true"
                                  className="pointer-events-none col-start-1 row-start-1 mr-3 size-5 self-center justify-self-end text-red-500 sm:size-4"
                                />
                              )}
                            </div>
                            {formErrors['item-name'] && (
                              <p id="item-name-error" className="mt-2 text-sm text-red-400">
                                {formErrors['item-name']}
                              </p>
                            )}
                          </div>

                          <fieldset>
                            <legend className="block text-sm/6 font-medium text-gray-300">Room</legend>
                            <div className="mt-2 grid grid-cols-3 gap-3">
                              {[
                                { id: 'kitchen', name: '🍳 Kitchen' },
                                { id: 'lounge', name: '🛋️ Lounge' },
                                { id: 'balcony', name: '🌿 Balcony' },
                                { id: 'bedroom', name: '🛏️ Bedroom' },
                                { id: 'office', name: '💻 Office' },
                                { id: 'bathroom', name: '🚿 Bathroom' },
                                { id: 'hallway', name: '🚪 Hallway' },
                                { id: 'storage', name: '📦 Storage' },
                                { id: 'None', name: '❓ None' }
                              ].map((option) => (
                                <label
                                  key={option.id}
                                  aria-label={option.name}
                                  className={`group relative flex items-center justify-center rounded-md border p-3 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-600 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo-600 ${formErrors['item-room']
                                    ? 'border-red-500 bg-red-900/20'
                                    : 'border-gray-600 bg-gray-800'
                                    }`}
                                >
                                  <input
                                    defaultValue={option.id}
                                    name="item-room"
                                    type="radio"
                                    onChange={() => clearFieldError('item-room')}
                                    className="absolute inset-0 appearance-none focus:outline focus:outline-0"
                                  />
                                  <span className="text-sm font-medium group-has-[:checked]:text-white text-gray-300">{option.name}</span>
                                </label>
                              ))}
                            </div>
                            {formErrors['item-room'] && (
                              <p className="mt-2 text-sm text-red-400">
                                {formErrors['item-room']}
                              </p>
                            )}
                          </fieldset>

                          <div>
                            <label htmlFor="item-box" className="block text-sm/6 font-medium text-gray-300">
                              Box
                            </label>
                            <div className="mt-2">
                              <select
                                id="item-box"
                                name="item-box"
                                className="block w-full rounded-md bg-gray-800 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
                              >
                                <option value="">Unassigned</option>
                                {boxes.map((box) => (
                                  <option key={box.id} value={box.id}>
                                    Box #{box.id} {box.size ? `(${box.size})` : ''} {box.location?.name ? `- ${box.location.name}` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="relative flex items-start">
                              <div className="flex h-6 items-center">
                                <input
                                  id="item-fragile"
                                  name="item-fragile"
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-600"
                                />
                              </div>
                              <div className="ml-3 text-sm leading-6">
                                <label htmlFor="item-fragile" className="font-medium text-gray-300">
                                  Fragile item
                                </label>
                                <p className="text-gray-400">Mark this if the item is breakable or delicate.</p>
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
                        {isSubmitting ? 'Adding...' : 'Add Item'}
                      </button>
                    </div>
                  </div>
                </form>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>

      {/* View Item Drawer */}
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
                          {selectedItem?.name || 'Item Details'}
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
                          Item details and properties.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="px-4 sm:px-6">
                        <div className="space-y-6 pb-5 pt-6">
                          <div>
                            <h3 className="text-sm/6 font-medium text-gray-300">Item Information</h3>
                            <dl className="mt-2 divide-y divide-gray-700">
                              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-400">Name</dt>
                                <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                  {(selectedItem?.name || 'Unnamed item')}{selectedItem?.fragile ? ' 🍷' : ''}
                                </dd>
                              </div>
                              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-400">Room</dt>
                                <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                  {formatRoom(selectedItem?.room || null)}
                                </dd>
                              </div>
                              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-400">Box</dt>
                                <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                  {selectedItem?.box ? `Box #${selectedItem.box.id}` : 'Unassigned'}
                                </dd>
                              </div>
                              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-400">Location</dt>
                                <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                  {selectedItem?.box?.location?.name || 'No location'}
                                </dd>
                              </div>
                              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-400">Created</dt>
                                <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                  {selectedItem?.created_at && new Date(selectedItem.created_at).toLocaleDateString()}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 justify-between px-4 py-4">
                    <button
                      type="button"
                      onClick={() => selectedItem && handleEditItem(selectedItem)}
                      className="rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-700 hover:text-white"
                    >
                      Edit Item
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

      {/* Edit Item Drawer */}
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
                        <DialogTitle className="text-base font-semibold text-white">Edit Item</DialogTitle>
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
                          Update your item information.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="divide-y divide-gray-700 px-4 sm:px-6">
                        <div className="space-y-6 pb-5 pt-6">
                          <div>
                            <label htmlFor="edit-item-name" className="block text-sm/6 font-medium text-gray-300">
                              Name
                            </label>
                            <div className="mt-2 grid grid-cols-1">
                              <input
                                id="edit-item-name"
                                name="item-name"
                                type="text"
                                defaultValue={selectedItem?.name || ''}
                                aria-invalid={formErrors['item-name'] ? 'true' : 'false'}
                                aria-describedby={formErrors['item-name'] ? 'item-name-error' : undefined}
                                onChange={() => clearFieldError('item-name')}
                                className={`col-start-1 row-start-1 block w-full rounded-md px-3 py-1.5 text-base outline outline-1 -outline-offset-1 placeholder:text-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 sm:text-sm/6 ${formErrors['item-name']
                                  ? 'bg-red-900/20 text-red-100 outline-red-500 placeholder:text-red-400 focus-visible:outline-red-500 pr-10'
                                  : 'bg-gray-800 text-white outline-gray-600 focus-visible:outline-indigo-600'
                                  }`}
                                placeholder="e.g., Winter jacket, Coffee mug, Books"
                              />
                              {formErrors['item-name'] && (
                                <ExclamationCircleIcon
                                  aria-hidden="true"
                                  className="pointer-events-none col-start-1 row-start-1 mr-3 size-5 self-center justify-self-end text-red-500 sm:size-4"
                                />
                              )}
                            </div>
                            {formErrors['item-name'] && (
                              <p id="item-name-error" className="mt-2 text-sm text-red-400">
                                {formErrors['item-name']}
                              </p>
                            )}
                          </div>

                          <fieldset>
                            <legend className="block text-sm/6 font-medium text-gray-300">Room</legend>
                            <div className="mt-2 grid grid-cols-3 gap-3">
                              {[
                                { id: 'kitchen', name: '🍳 Kitchen' },
                                { id: 'lounge', name: '🛋️ Lounge' },
                                { id: 'balcony', name: '🌿 Balcony' },
                                { id: 'bedroom', name: '🛏️ Bedroom' },
                                { id: 'office', name: '💻 Office' },
                                { id: 'bathroom', name: '🚿 Bathroom' },
                                { id: 'hallway', name: '🚪 Hallway' },
                                { id: 'storage', name: '📦 Storage' },
                                { id: 'None', name: '❓ None' }
                              ].map((option) => (
                                <label
                                  key={option.id}
                                  aria-label={option.name}
                                  className={`group relative flex items-center justify-center rounded-md border p-3 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-600 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo-600 ${formErrors['item-room']
                                    ? 'border-red-500 bg-red-900/20'
                                    : 'border-gray-600 bg-gray-800'
                                    }`}
                                >
                                  <input
                                    defaultValue={option.id}
                                    defaultChecked={selectedItem?.room === option.id || (selectedItem?.room === null && option.id === 'None')}
                                    name="item-room"
                                    type="radio"
                                    onChange={() => clearFieldError('item-room')}
                                    className="absolute inset-0 appearance-none focus:outline focus:outline-0"
                                  />
                                  <span className="text-sm font-medium group-has-[:checked]:text-white text-gray-300">{option.name}</span>
                                </label>
                              ))}
                            </div>
                            {formErrors['item-room'] && (
                              <p className="mt-2 text-sm text-red-400">
                                {formErrors['item-room']}
                              </p>
                            )}
                          </fieldset>

                          <div>
                            <label htmlFor="edit-item-box" className="block text-sm/6 font-medium text-gray-300">
                              Box
                            </label>
                            <div className="mt-2">
                              <select
                                id="edit-item-box"
                                name="item-box"
                                defaultValue={selectedItem?.box_id?.toString() || ''}
                                className="block w-full rounded-md bg-gray-800 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
                              >
                                <option value="">Unassigned</option>
                                {boxes.map((box) => (
                                  <option key={box.id} value={box.id}>
                                    Box #{box.id} {box.size ? `(${box.size})` : ''} {box.location?.name ? `- ${box.location.name}` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="relative flex items-start">
                              <div className="flex h-6 items-center">
                                <input
                                  id="edit-item-fragile"
                                  name="item-fragile"
                                  type="checkbox"
                                  defaultChecked={selectedItem?.fragile}
                                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-600"
                                />
                              </div>
                              <div className="ml-3 text-sm leading-6">
                                <label htmlFor="edit-item-fragile" className="font-medium text-gray-300">
                                  Fragile item
                                </label>
                                <p className="text-gray-400">Mark this if the item is breakable or delicate.</p>
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
    </Layout>
  )
}

export default Items