import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
    constructor(private readonly requestsService: RequestsService) { }

    @Get()
    findAll() {
        return this.requestsService.findAll();
    }

    @Post()
    create(@Body() createRequestDto: CreateRequestDto) {
        return this.requestsService.create(createRequestDto);
    }

    @Get('client/:userId')
    findByClient(@Param('userId') userId: string) {
        return this.requestsService.findByClient(Number(userId));
    }

    @Get('client/:userId/pending')
    findRecentPendingByClient(@Param('userId') userId: string) {
        return this.requestsService.findRecentPendingByClient(Number(userId));
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.requestsService.findOne(Number(id));
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateRequestDto: UpdateRequestDto,
    ) {
        return this.requestsService.update(Number(id), updateRequestDto);
    }

    @Patch(':id/cancel')
    cancelRequest(
        @Param('id') id: string,
        @Body('userId') userId: number,
    ) {
        return this.requestsService.cancelRequest(Number(id), Number(userId));
    }
}