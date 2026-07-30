import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Fragment, useEffect, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconPlus from '../../components/Icon/IconPlus';
import IconX from '../../components/Icon/IconX';
import { ServerSetting } from '../../helperComponents/ServerSetting';

const Calendar = () => {
    const dispatch = useDispatch();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddEventModal, setIsAddEventModal] = useState(false);
    const [minStartDate, setMinStartDate] = useState<any>('');
    const [minEndDate, setMinEndDate] = useState<any>('');
    const defaultParams = { id: null, title: '', start: '', end: '', description: '', type: 'primary', notifyMe: false, notifyAt: '' };
    const [params, setParams] = useState<any>(defaultParams);
    const [saving, setSaving] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const notifiedIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        dispatch(setPageTitle('My Planner'));
    }, [dispatch]);

    const fetchEvents = async () => {
        try {
            const res = await axios.get(`${ServerSetting.apiUrl}/planner/events`);
            if (res.data?.success && Array.isArray(res.data?.data)) {
                const formatted = res.data.data.map((e: any) => ({
                    id: e.id,
                    title: e.title,
                    start: e.start,
                    end: e.end,
                    className: e.className || 'primary',
                    extendedProps: { description: e.description || '' },
                }));
                setEvents(formatted);
            }
        } catch (err) {
            console.error('Failed to fetch planner events:', err);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // Poll for pending notifications every 30 seconds
    useEffect(() => {
        const checkNotifications = async () => {
            try {
                const res = await axios.get(`${ServerSetting.apiUrl}/planner/events/pending-notifications`);
                if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
                    for (const item of res.data.data) {
                        if (notifiedIds.current.has(item.id)) continue;
                        notifiedIds.current.add(item.id);
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('My Planner – Reminder', {
                                body: item.title + (item.description ? `\n${item.description}` : ''),
                                icon: '/assets/images/commission-shop-logo.png',
                            });
                        }
                        showMessage(`${item.title} – Reminder!`, 'info');
                        try {
                            await axios.post(`${ServerSetting.apiUrl}/planner/events/${item.id}/mark-notified`);
                        } catch {
                            notifiedIds.current.delete(item.id);
                        }
                    }
                }
            } catch {
                // ignore
            }
        };
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        pollRef.current = setInterval(checkNotifications, 30000);
        checkNotifications();
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    const dateFormat = (dt: any) => {
        dt = new Date(dt);
        const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
        const date = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
        const hours = dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours();
        const mins = dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes();
        return dt.getFullYear() + '-' + month + '-' + date + 'T' + hours + ':' + mins;
    };

    const editEvent = (data: any = null) => {
        let nextParams = { ...defaultParams };
        setParams(nextParams);
        if (data) {
            const obj = data.event ? data.event : data;
            const startVal = obj.start ? dateFormat(obj.start) : '';
            const endVal = obj.end ? dateFormat(obj.end) : '';
            setParams({
                id: obj.id || null,
                title: obj.title || '',
                start: startVal,
                end: endVal,
                description: obj.extendedProps?.description || obj.description || '',
                type: obj.classNames?.[0] || obj.className || 'primary',
                notifyMe: false,
                notifyAt: '',
            });
            setMinStartDate(new Date());
            setMinEndDate(startVal);
        } else {
            setMinStartDate(new Date());
            setMinEndDate(new Date());
        }
        setIsAddEventModal(true);
    };

    const editDate = (data: any) => {
        editEvent({ event: { start: data.start, end: data.end } });
    };

    const saveEvent = async () => {
        if (!params.title) {
            showMessage('Please enter event title.', 'error');
            return;
        }
        if (!params.start || !params.end) {
            showMessage('Please enter start and end date/time.', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload: any = {
                title: params.title,
                start: params.start,
                end: params.end,
                description: params.description || '',
                color: params.type || 'primary',
            };
            if (params.notifyMe && params.notifyAt) {
                payload.notifyAt = params.notifyAt;
            }
            if (params.id) {
                const res = await axios.patch(`${ServerSetting.apiUrl}/planner/events/${params.id}`, payload);
                if (res.data?.success) {
                    await fetchEvents();
                    showMessage('Activity updated successfully.');
                    setIsAddEventModal(false);
                }
            } else {
                const res = await axios.post(`${ServerSetting.apiUrl}/planner/events`, payload);
                if (res.data?.success) {
                    await fetchEvents();
                    showMessage('Activity added successfully.');
                    setIsAddEventModal(false);
                }
            }
        } catch (err: any) {
            showMessage(err.response?.data?.message || 'Failed to save activity.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteEvent = async () => {
        if (!params.id) return;
        const confirm = await Swal.fire({
            title: 'Delete this activity?',
            text: 'This cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
        });
        if (!confirm.isConfirmed) return;
        setSaving(true);
        try {
            await axios.delete(`${ServerSetting.apiUrl}/planner/events/${params.id}`);
            await fetchEvents();
            showMessage('Activity deleted.');
            setIsAddEventModal(false);
        } catch (err: any) {
            showMessage(err.response?.data?.message || 'Failed to delete.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const startDateChange = (event: any) => {
        const dateStr = event.target.value;
        if (dateStr) {
            setMinEndDate(dateStr);
            setParams({ ...params, start: dateStr, end: params.end || dateStr });
        }
    };

    const changeValue = (e: any) => {
        const { value, id } = e.target;
        setParams({ ...params, [id]: value });
    };

    const showMessage = (msg = '', type = 'success') => {
        const toast: any = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
            customClass: { container: 'toast' },
        });
        toast.fire({ icon: type, title: msg, padding: '10px 20px' });
    };

    return (
        <div>
            <div className="panel mb-5">
                <div className="mb-4 flex items-center sm:flex-row flex-col sm:justify-between justify-center">
                    <div className="sm:mb-0 mb-4">
                        <div className="text-lg font-semibold ltr:sm:text-left rtl:sm:text-right text-center">My Planner</div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your personal activities & reminders</p>
                        <div className="flex items-center mt-2 flex-wrap sm:justify-start justify-center gap-4">
                            <div className="flex items-center">
                                <div className="h-2.5 w-2.5 rounded-sm ltr:mr-2 rtl:ml-2 bg-primary"></div>
                                <span>Work</span>
                            </div>
                            <div className="flex items-center">
                                <div className="h-2.5 w-2.5 rounded-sm ltr:mr-2 rtl:ml-2 bg-info"></div>
                                <span>Travel</span>
                            </div>
                            <div className="flex items-center">
                                <div className="h-2.5 w-2.5 rounded-sm ltr:mr-2 rtl:ml-2 bg-success"></div>
                                <span>Personal</span>
                            </div>
                            <div className="flex items-center">
                                <div className="h-2.5 w-2.5 rounded-sm ltr:mr-2 rtl:ml-2 bg-danger"></div>
                                <span>Important</span>
                            </div>
                        </div>
                    </div>
                    <button type="button" className="btn btn-primary" onClick={() => editEvent()}>
                        <IconPlus className="ltr:mr-2 rtl:ml-2" />
                        Add Activity / Note
                    </button>
                </div>
                <div className="calendar-wrapper">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <span className="animate-spin border-2 border-primary border-t-transparent rounded-full w-8 h-8 inline-block"></span>
                        </div>
                    ) : (
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay',
                            }}
                            editable={true}
                            dayMaxEvents={true}
                            selectable={true}
                            droppable={true}
                            eventClick={(event: any) => editEvent(event)}
                            select={(event: any) => editDate(event)}
                            events={events}
                        />
                    )}
                </div>
            </div>

            <Transition appear show={isAddEventModal} as={Fragment}>
                <Dialog as="div" onClose={() => setIsAddEventModal(false)} open={isAddEventModal} className="relative z-[51]">
                    <Transition.Child as={Fragment} enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100" leave="duration-200 ease-out" leave-from="opacity-100" leave-to="opacity-0">
                        <Dialog.Overlay className="fixed inset-0 bg-[black]/60" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <Transition.Child as={Fragment} enter="duration-300 ease-out" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100" leave="duration-200 ease-out" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
                                <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white-dark">
                                    <button type="button" className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none" onClick={() => setIsAddEventModal(false)}>
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                        {params.id ? 'Edit Activity' : 'Add Activity / Note'}
                                    </div>
                                    <div className="p-5">
                                        <form className="space-y-5">
                                            <div>
                                                <label htmlFor="title">Title</label>
                                                <input id="title" type="text" name="title" className="form-input" placeholder="e.g. Call supplier at 3 PM" value={params.title || ''} onChange={changeValue} required />
                                            </div>
                                            <div>
                                                <label htmlFor="dateStart">From</label>
                                                <input id="start" type="datetime-local" name="start" className="form-input" value={params.start || ''} min={minStartDate} onChange={startDateChange} required />
                                            </div>
                                            <div>
                                                <label htmlFor="dateEnd">To</label>
                                                <input id="end" type="datetime-local" name="end" className="form-input" value={params.end || ''} min={minEndDate} onChange={changeValue} required />
                                            </div>
                                            <div>
                                                <label htmlFor="description">Notes / Description</label>
                                                <textarea id="description" name="description" className="form-textarea min-h-[100px]" placeholder="Add details..." value={params.description || ''} onChange={changeValue}></textarea>
                                            </div>
                                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                                <label className="flex items-center gap-2 cursor-pointer mb-3">
                                                    <input type="checkbox" checked={params.notifyMe || false} onChange={(e) => setParams({ ...params, notifyMe: e.target.checked, notifyAt: e.target.checked ? params.notifyAt || params.start : '' })} />
                                                    <span className="font-medium">Notify me when it's time</span>
                                                </label>
                                                {params.notifyMe && (
                                                    <div className="mt-2">
                                                        <label className="block text-sm mb-1">Remind at</label>
                                                        <input type="datetime-local" className="form-input" value={params.notifyAt || ''} min={params.start} onChange={(e) => setParams({ ...params, notifyAt: e.target.value })} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label>Category</label>
                                                <div className="mt-2 flex flex-wrap gap-3">
                                                    {[
                                                        { value: 'primary', label: 'Work' },
                                                        { value: 'info', label: 'Travel' },
                                                        { value: 'success', label: 'Personal' },
                                                        { value: 'danger', label: 'Important' },
                                                    ].map((opt) => (
                                                        <label key={opt.value} className="inline-flex cursor-pointer">
                                                            <input type="radio" className="form-radio" name="type" value={opt.value} checked={params.type === opt.value} onChange={(e) => setParams({ ...params, type: e.target.value })} />
                                                            <span className="ltr:pl-2 rtl:pr-2">{opt.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex justify-end items-center gap-2 !mt-8">
                                                {params.id && (
                                                    <button type="button" className="btn btn-outline-danger" onClick={deleteEvent} disabled={saving}>
                                                        Delete
                                                    </button>
                                                )}
                                                <button type="button" className="btn btn-outline-secondary" onClick={() => setIsAddEventModal(false)}>
                                                    Cancel
                                                </button>
                                                <button type="button" onClick={saveEvent} className="btn btn-primary" disabled={saving}>
                                                    {saving ? 'Saving...' : params.id ? 'Update' : 'Create'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default Calendar;
