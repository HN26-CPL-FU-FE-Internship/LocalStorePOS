import { api } from "@/lib/axios"
import type { ApiResponse } from "@/types/auth"

export type CategoryStatus = 'active' | 'inactive'

export interface CategoryEntry {
    id: number
    name: string
    imagePath: string| null
    itemCount: number
    status: CategoryStatus
    createdAt:string
    updatedAt: string
}

export interface PageResponse<T> {
    items: T[]
    page: number
    size: number
    totalPages: number
    totalElements: number
    first: boolean
    last: boolean
}

export interface CategoryQuery {
    page?: number
    size?: number
    sortBy?: string
    sortDir?: string
    search?: string
    status?: CategoryStatus
}

export interface CategoryFormData {
    name: string
    status?: CategoryStatus
    image?: File | null
}

/* ------------------------------------------------------------------ */
/*  API calls                                                         */
/* ------------------------------------------------------------------ */

export const getCategories = async (
    params: CategoryQuery
): Promise<PageResponse<CategoryEntry>> => {
    const {data} = await api.get<ApiResponse<PageResponse<CategoryEntry>>>('/categories',{
        params,
    });
    return data.result;
}

const toFormData = (payload: CategoryFormData): FormData => {
    const formData = new FormData()
    formData.append('name',payload.name)

    if(payload.status){
        formData.append('status',payload.status)
    }

    if(payload.image){
        formData.append('image',payload.image)
    }

    return formData
}

export const createCategory = async (payload: CategoryFormData): Promise<CategoryEntry> => {
    const {data} = await api.post<ApiResponse<CategoryEntry>>('/categories',toFormData(payload),{
        headers: {'Content-Type': 'multipart/form-data'},
    })
    return data.result
}

export const updateCategory = async(
    id:number,
    payload: CategoryFormData
): Promise<CategoryEntry> => {
    const {data} = await api.put<ApiResponse<CategoryEntry>>(
        `/categories/${id}`,
        toFormData(payload),
        { headers: {'Content-Type': 'multipart/form-data'}}
    );
    return data.result
}

export const updateCategoryStatus = async (
    id: number,
    status: CategoryStatus
): Promise<CategoryEntry> => {
    const {data} = await api.patch<ApiResponse<CategoryEntry>>(
        `/categories/${id}/status`,
        null,
        {params:{status}}
    )
    return data.result
}

export const deleteCategory = async(id: number):Promise<void> => {
    await api.delete(`/categories/${id}`)
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
// The API returns image paths relative to the backend context path
// (e.g. "/uploads/categories/xxx.png"); build the full URL for <img src>.

export const getCategoryImageUrl = (imagePath: string | null): string | undefined => {
    if(!imagePath) return undefined
    if(imagePath.startsWith('http')) return imagePath

    const base = api.defaults.baseURL?.replace(/\/api\/?$/, '') ?? '';
    return `${base}${imagePath}`
} 