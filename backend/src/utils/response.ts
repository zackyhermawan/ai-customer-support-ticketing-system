import { Response } from "express"

export const success = (res: Response, data: any, message: string = "Success", status: number) => {
    return res.status(status).json({
        success: true,
        message,
        data
    })
}