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
  box_count?: number
  item_count?: number
}

function Locations() {
  const { user } = useAuth()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      fetchLocations()
    }
  }, [user])

  const fetchLocations = async () => {
    if (!user || !supabase) return

    // First get all locations
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('created_at', { ascending: false })

    if (locationsError) {
      console.error('Error fetching locations:', locationsError)
      setLoading(false)
      return
    }

    // Then get counts for each location
    const locationsWithCounts = await Promise.all(
      (locations || []).map(async (location) => {
        if (!supabase) return { ...location, box_count: 0, item_count: 0 }
        
        // Get box count
        const { count: boxCount } = await supabase
          .from('boxes')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', location.id)
          .eq('user_id', user.id)

        // Get item count (items in boxes at this location)
        const { count: itemCount } = await supabase
          .from('items')
          .select('*, boxes!inner(location_id)', { count: 'exact', head: true })
          .eq('boxes.location_id', location.id)
          .eq('user_id', user.id)

        return {
          ...location,
          box_count: boxCount || 0,
          item_count: itemCount || 0
        }
      })
    )

    setLocations(locationsWithCounts)
    setLoading(false)
  }

  const handleAddLocation = () => {
    setDrawerOpen(true)
    setFormErrors({})
  }

  const handleViewLocation = (location: Location) => {
    setSelectedLocation(location)
    setViewDrawerOpen(true)
  }

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location)
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

    const name = formData.get('location-name') as string
    const address = formData.get('location-address') as string
    const type = formData.get('location-type') as string

    if (!name || name.trim().length === 0) {
      errors['location-name'] = 'Location name is required'
    } else if (name.trim().length < 2) {
      errors['location-name'] = 'Location name must be at least 2 characters'
    }

    if (!address || address.trim().length === 0) {
      errors['location-address'] = 'Address is required'
    } else if (address.trim().length < 5) {
      errors['location-address'] = 'Address must be at least 5 characters'
    }

    if (!type) {
      errors['location-type'] = 'Location type is required'
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

      const name = formData.get('location-name') as string
      const type = formData.get('location-type') as string
      const address = formData.get('location-address') as string

      const { data, error } = await supabase
        .from('locations')
        .insert([
          {
            name: name.trim(),
            icon: type, // Store the type as the icon field
            address: address.trim(),
            user_id: user.id
          }
        ])
        .select()

      if (error) {
        throw error
      }

      console.log('Location created successfully:', data)

      // Refresh the locations list
      await fetchLocations()

      // Close drawer on success
      setDrawerOpen(false)
      // Reset form
      e.currentTarget.reset()
    } catch (error) {
      console.error('Error adding location:', error)
      setFormErrors({ general: 'Failed to add location. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedLocation) return

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

      const name = formData.get('location-name') as string
      const type = formData.get('location-type') as string
      const address = formData.get('location-address') as string

      const { data, error } = await supabase
        .from('locations')
        .update({
          name: name.trim(),
          icon: type,
          address: address.trim(),
        })
        .eq('id', selectedLocation.id)
        .eq('user_id', user.id)
        .select()

      if (error) {
        throw error
      }

      console.log('Location updated successfully:', data)

      // Refresh the locations list
      await fetchLocations()

      // Close drawer on success
      setEditDrawerOpen(false)
      setSelectedLocation(null)
    } catch (error) {
      console.error('Error updating location:', error)
      setFormErrors({ general: 'Failed to update location. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Layout routeId="locations">
      <Header button={{ label: 'Add location', onClick: handleAddLocation }}>Locations</Header>

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
              <h3 className="mt-2 text-sm font-semibold text-white">Loading locations...</h3>
              <p className="mt-1 text-sm text-gray-400">Please wait while we fetch your locations.</p>
            </div>
          </div>
        ) : locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-white">No locations</h3>
              <p className="mt-1 text-sm text-gray-400">Get started by creating your first location.</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleAddLocation}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  <svg className="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                  Add Location
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
                          Name
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                          Address
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-white">
                          Boxes
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-white">
                          Items
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                          <span className="sr-only">View</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {locations.map((location) => (
                        <tr key={location.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-0 align-top">
                            {location.name}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-300 whitespace-pre-wrap align-top">{location.address}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 align-top text-center">{location.box_count || 0}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 align-top text-center">{location.item_count || 0}</td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0 align-top">
                            <button
                              onClick={() => handleViewLocation(location)}
                              className="text-indigo-400 hover:text-indigo-300"
                            >
                              View<span className="sr-only">, {location.id}</span>
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

      {/* Add Location Drawer */}
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
                        <DialogTitle className="text-base font-semibold text-white">Add Location</DialogTitle>
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
                          Create a new location to organize your items and boxes.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="divide-y divide-gray-700 px-4 sm:px-6">
                        <div className="space-y-6 pb-5 pt-6">
                          <div>
                            <label htmlFor="location-name" className="block text-sm/6 font-medium text-gray-300">
                              Name
                            </label>
                            <div className="mt-2 grid grid-cols-1">
                              <input
                                id="location-name"
                                name="location-name"
                                type="text"
                                aria-invalid={formErrors['location-name'] ? 'true' : 'false'}
                                aria-describedby={formErrors['location-name'] ? 'location-name-error' : undefined}
                                onChange={() => clearFieldError('location-name')}
                                className={`col-start-1 row-start-1 block w-full rounded-md px-3 py-1.5 text-base outline outline-1 -outline-offset-1 placeholder:text-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 sm:text-sm/6 ${formErrors['location-name']
                                  ? 'bg-red-900/20 text-red-100 outline-red-500 placeholder:text-red-400 focus-visible:outline-red-500 pr-10'
                                  : 'bg-gray-800 text-white outline-gray-600 focus-visible:outline-indigo-600'
                                  }`}
                                placeholder="Enter location name"
                              />
                              {formErrors['location-name'] && (
                                <ExclamationCircleIcon
                                  aria-hidden="true"
                                  className="pointer-events-none col-start-1 row-start-1 mr-3 size-5 self-center justify-self-end text-red-500 sm:size-4"
                                />
                              )}
                            </div>
                            {formErrors['location-name'] && (
                              <p id="location-name-error" className="mt-2 text-sm text-red-400">
                                {formErrors['location-name']}
                              </p>
                            )}
                          </div>
                          <fieldset aria-label="Choose a location type">
                            <div className="flex items-center justify-between">
                              <div className="text-sm/6 font-medium text-gray-300">Type</div>
                            </div>
                            <div className="mt-2 grid grid-cols-3 gap-3">
                              {[
                                { id: 'house', name: '🏠 House' },
                                { id: 'storage', name: '📦 Storage' },
                                { id: 'other', name: '📍 Other' }
                              ].map((option) => (
                                <label
                                  key={option.id}
                                  aria-label={option.name}
                                  className={`group relative flex items-center justify-center rounded-md border p-3 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-600 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo-600 ${formErrors['location-type']
                                    ? 'border-red-500 bg-red-900/20'
                                    : 'border-gray-600 bg-gray-800'
                                    }`}
                                >
                                  <input
                                    defaultValue={option.id}
                                    name="location-type"
                                    type="radio"
                                    onChange={() => clearFieldError('location-type')}
                                    className="absolute inset-0 appearance-none focus:outline focus:outline-0"
                                  />
                                  <span className="text-sm font-medium group-has-[:checked]:text-white text-gray-300">{option.name}</span>
                                </label>
                              ))}
                            </div>
                            {formErrors['location-type'] && (
                              <p className="mt-2 text-sm text-red-400">
                                {formErrors['location-type']}
                              </p>
                            )}
                          </fieldset>
                          <div>
                            <label htmlFor="location-address" className="block text-sm/6 font-medium text-gray-300">
                              Address
                            </label>
                            <div className="mt-2 grid grid-cols-1">
                              <textarea
                                id="location-address"
                                name="location-address"
                                rows={6}
                                aria-invalid={formErrors['location-address'] ? 'true' : 'false'}
                                aria-describedby={formErrors['location-address'] ? 'location-address-error' : undefined}
                                onChange={() => clearFieldError('location-address')}
                                className={`col-start-1 row-start-1 block w-full rounded-md px-3 py-1.5 text-base outline outline-1 -outline-offset-1 placeholder:text-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 sm:text-sm/6 ${formErrors['location-address']
                                  ? 'bg-red-900/20 text-red-100 outline-red-500 placeholder:text-red-400 focus-visible:outline-red-500 pr-10'
                                  : 'bg-gray-800 text-white outline-gray-600 focus-visible:outline-indigo-600'
                                  }`}
                                placeholder="Enter address"
                                defaultValue={''}
                              />
                              {formErrors['location-address'] && (
                                <ExclamationCircleIcon
                                  aria-hidden="true"
                                  className="pointer-events-none col-start-1 row-start-1 mr-3 mt-2 size-5 self-start justify-self-end text-red-500 sm:size-4"
                                />
                              )}
                            </div>
                            {formErrors['location-address'] && (
                              <p id="location-address-error" className="mt-2 text-sm text-red-400">
                                {formErrors['location-address']}
                              </p>
                            )}
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
                        {isSubmitting ? 'Adding...' : 'Add Location'}
                      </button>
                    </div>
                  </div>
                </form>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>

      {/* View Location Drawer */}
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
                          {selectedLocation?.name}
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
                          Location details and associated items.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="px-4 sm:px-6">
                        <div className="space-y-6 pb-5 pt-6">
                          <div>
                            <h3 className="text-sm/6 font-medium text-gray-300">Location Information</h3>
                            <dl className="mt-2 divide-y divide-gray-700">
                              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-400">Name</dt>
                                <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">{selectedLocation?.name}</dd>
                              </div>
                              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-400">Type</dt>
                                <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                  {selectedLocation?.icon === 'house' && '🏠 House'}
                                  {selectedLocation?.icon === 'storage' && '📦 Storage'}
                                  {selectedLocation?.icon === 'other' && '📍 Other'}
                                </dd>
                              </div>
                              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-400">Address</dt>
                                <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0 whitespace-pre-wrap">
                                  {selectedLocation?.address}
                                </dd>
                              </div>
                              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-400">Created</dt>
                                <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                  {selectedLocation?.created_at && new Date(selectedLocation.created_at).toLocaleDateString()}
                                </dd>
                              </div>
                            </dl>
                          </div>

                          <div>
                            <h3 className="text-sm/6 font-medium text-gray-300">Items & Boxes</h3>
                            <div className="mt-2 text-center py-8">
                              <div className="mx-auto h-12 w-12 text-gray-400">
                                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                              <p className="mt-2 text-sm text-gray-400">No items or boxes yet</p>
                              <p className="text-sm text-gray-500">Items and boxes will appear here when added</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 justify-between px-4 py-4">
                    <button
                      type="button"
                      onClick={() => selectedLocation && handleEditLocation(selectedLocation)}
                      className="rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-700 hover:text-white"
                    >
                      Edit Location
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

      {/* Edit Location Drawer */}
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
                        <DialogTitle className="text-base font-semibold text-white">Edit Location</DialogTitle>
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
                          Update your location information.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="divide-y divide-gray-700 px-4 sm:px-6">
                        <div className="space-y-6 pb-5 pt-6">
                          <div>
                            <label htmlFor="edit-location-name" className="block text-sm/6 font-medium text-gray-300">
                              Name
                            </label>
                            <div className="mt-2 grid grid-cols-1">
                              <input
                                id="edit-location-name"
                                name="location-name"
                                type="text"
                                defaultValue={selectedLocation?.name}
                                aria-invalid={formErrors['location-name'] ? 'true' : 'false'}
                                aria-describedby={formErrors['location-name'] ? 'location-name-error' : undefined}
                                onChange={() => clearFieldError('location-name')}
                                className={`col-start-1 row-start-1 block w-full rounded-md px-3 py-1.5 text-base outline outline-1 -outline-offset-1 placeholder:text-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 sm:text-sm/6 ${formErrors['location-name']
                                  ? 'bg-red-900/20 text-red-100 outline-red-500 placeholder:text-red-400 focus-visible:outline-red-500 pr-10'
                                  : 'bg-gray-800 text-white outline-gray-600 focus-visible:outline-indigo-600'
                                  }`}
                                placeholder="Enter location name"
                              />
                              {formErrors['location-name'] && (
                                <ExclamationCircleIcon
                                  aria-hidden="true"
                                  className="pointer-events-none col-start-1 row-start-1 mr-3 size-5 self-center justify-self-end text-red-500 sm:size-4"
                                />
                              )}
                            </div>
                            {formErrors['location-name'] && (
                              <p id="location-name-error" className="mt-2 text-sm text-red-400">
                                {formErrors['location-name']}
                              </p>
                            )}
                          </div>
                          <fieldset aria-label="Choose a location type">
                            <div className="flex items-center justify-between">
                              <div className="text-sm/6 font-medium text-gray-300">Type</div>
                            </div>
                            <div className="mt-2 grid grid-cols-3 gap-3">
                              {[
                                { id: 'house', name: '🏠 House' },
                                { id: 'storage', name: '📦 Storage' },
                                { id: 'other', name: '📍 Other' }
                              ].map((option) => (
                                <label
                                  key={option.id}
                                  aria-label={option.name}
                                  className={`group relative flex items-center justify-center rounded-md border p-3 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-600 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo-600 ${formErrors['location-type']
                                    ? 'border-red-500 bg-red-900/20'
                                    : 'border-gray-600 bg-gray-800'
                                    }`}
                                >
                                  <input
                                    defaultValue={option.id}
                                    defaultChecked={selectedLocation?.icon === option.id}
                                    name="location-type"
                                    type="radio"
                                    onChange={() => clearFieldError('location-type')}
                                    className="absolute inset-0 appearance-none focus:outline focus:outline-0"
                                  />
                                  <span className="text-sm font-medium group-has-[:checked]:text-white text-gray-300">{option.name}</span>
                                </label>
                              ))}
                            </div>
                            {formErrors['location-type'] && (
                              <p className="mt-2 text-sm text-red-400">
                                {formErrors['location-type']}
                              </p>
                            )}
                          </fieldset>
                          <div>
                            <label htmlFor="edit-location-address" className="block text-sm/6 font-medium text-gray-300">
                              Address
                            </label>
                            <div className="mt-2 grid grid-cols-1">
                              <textarea
                                id="edit-location-address"
                                name="location-address"
                                rows={6}
                                defaultValue={selectedLocation?.address}
                                aria-invalid={formErrors['location-address'] ? 'true' : 'false'}
                                aria-describedby={formErrors['location-address'] ? 'location-address-error' : undefined}
                                onChange={() => clearFieldError('location-address')}
                                className={`col-start-1 row-start-1 block w-full rounded-md px-3 py-1.5 text-base outline outline-1 -outline-offset-1 placeholder:text-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 sm:text-sm/6 ${formErrors['location-address']
                                  ? 'bg-red-900/20 text-red-100 outline-red-500 placeholder:text-red-400 focus-visible:outline-red-500 pr-10'
                                  : 'bg-gray-800 text-white outline-gray-600 focus-visible:outline-indigo-600'
                                  }`}
                                placeholder="Enter address"
                              />
                              {formErrors['location-address'] && (
                                <ExclamationCircleIcon
                                  aria-hidden="true"
                                  className="pointer-events-none col-start-1 row-start-1 mr-3 mt-2 size-5 self-start justify-self-end text-red-500 sm:size-4"
                                />
                              )}
                            </div>
                            {formErrors['location-address'] && (
                              <p id="location-address-error" className="mt-2 text-sm text-red-400">
                                {formErrors['location-address']}
                              </p>
                            )}
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

export default Locations