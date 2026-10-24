import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request.dto';
import { RequestsService } from './requests.service';

const requestValidationPipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
});

@Controller('requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
    constructor(private readonly requestsService: RequestsService) { }

    @Post()
    create(
        @Req() req: { user: { id: string } },
        @Body(requestValidationPipe) dto: CreateRequestDto
    ) {
        return this.requestsService.create(req.user.id, dto);
    }

    @Get()
    findAllMyRequests(@Req() req: { user: { id: string } }) {
        return this.requestsService.findAllByClient(req.user.id);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.requestsService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body(requestValidationPipe) dto: UpdateRequestStatusDto,
    ) {
        return this.requestsService.updateStatus(id, dto);
    }
}