import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CyclesService } from './cycles.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateCycleDto, UpdateCycleDto, RolloverCycleDto } from './dto/create-cycle.dto.js';

@ApiTags('Cycles')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('cycles')
export class CyclesController {
  constructor(private readonly cyclesService: CyclesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all cycles for a workspace with velocity & burndown stats' })
  @ApiQuery({ name: 'workspaceId', required: true })
  async getCycles(@Query('workspaceId') workspaceId: string) {
    return this.cyclesService.getCycles(workspaceId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get currently active cycle for workspace' })
  @ApiQuery({ name: 'workspaceId', required: true })
  async getActiveCycle(@Query('workspaceId') workspaceId: string) {
    return this.cyclesService.getActiveCycle(workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cycle detail with tasks and burn-down metrics' })
  @ApiParam({ name: 'id', description: 'Cycle ID' })
  async getCycleById(@Param('id') id: string) {
    return this.cyclesService.getCycleById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new cycle / sprint' })
  async createCycle(@Body() body: CreateCycleDto) {
    return this.cyclesService.createCycle(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update cycle details or status' })
  @ApiParam({ name: 'id', description: 'Cycle ID' })
  async updateCycle(@Param('id') id: string, @Body() body: UpdateCycleDto) {
    return this.cyclesService.updateCycle(id, body);
  }

  @Post(':id/rollover')
  @ApiOperation({
    summary: 'Rollover incomplete tasks from completed cycle into next cycle or backlog',
  })
  @ApiParam({ name: 'id', description: 'Cycle ID' })
  async rolloverCycle(@Param('id') id: string, @Body() body: RolloverCycleDto) {
    return this.cyclesService.rolloverCycle(id, body);
  }
}
