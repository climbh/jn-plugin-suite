interface BaseResponse {
    code: '000000' | '500000' | '800403' | '800405'
    data: any
    msg: string
    status: number | string
    success: boolean
}

export interface ApiType {
    user: {
        apis: (params?: any) => Promise<BaseResponse>
        }
    
}