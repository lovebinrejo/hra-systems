import api from './api';
import type { Event, Announcement, PaginatedResponse } from '../types';

export const eventService = {
  getEvents: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Event>>('/events/events/', { params }),

  getUpcomingEvents: () => api.get<Event[]>('/events/events/upcoming/'),

  createEvent: (data: Partial<Event>) => api.post<Event>('/events/events/', data),

  updateEvent: (id: number, data: Partial<Event>) =>
    api.patch<Event>(`/events/events/${id}/`, data),

  deleteEvent: (id: number) => api.delete(`/events/events/${id}/`),

  getAnnouncements: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Announcement>>('/events/announcements/', { params }),

  createAnnouncement: (data: Partial<Announcement>) =>
    api.post<Announcement>('/events/announcements/', data),

  updateAnnouncement: (id: number, data: Partial<Announcement>) =>
    api.patch<Announcement>(`/events/announcements/${id}/`, data),

  deleteAnnouncement: (id: number) => api.delete(`/events/announcements/${id}/`),
};
