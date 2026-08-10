package com.pos.backend.service.Table;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.dto.request.TableFloor.TableFloorRequest;
import com.pos.backend.dto.response.Common.OptionResponse;
import com.pos.backend.entity.TableFloor;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.RestaurantTableRepository;
import com.pos.backend.repository.TableFloorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TableFloorServiceImpl implements TableFloorService {

    private final TableFloorRepository tableFloorRepository;
    private final RestaurantTableRepository restaurantTableRepository;

    @Override
    @Transactional(readOnly = true)
    public List<OptionResponse> getFloors() {
        return tableFloorRepository.findAllByOrderByIdAsc()
                .stream()
                .map(f -> OptionResponse.builder().id(f.getId()).name(f.getName()).build())
                .toList();
    }

    @Override
    @Transactional
    public OptionResponse createFloor(TableFloorRequest request) {
        String name = request.getName().trim();

        if (tableFloorRepository.existsByNameIgnoreCase(name)) {
            throw new AppException(ErrorCode.TABLE_FLOOR_NAME_ALREADY_EXISTS);
        }

        TableFloor floor = TableFloor.builder().name(name).build();
        floor = tableFloorRepository.save(floor);

        return OptionResponse.builder().id(floor.getId()).name(floor.getName()).build();
    }

    @Override
    @Transactional
    public void deleteFloor(Long id) {
        TableFloor floor = tableFloorRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TABLE_FLOOR_NOT_FOUND));

        if (restaurantTableRepository.countByFloorId(id) > 0) {
            throw new AppException(ErrorCode.TABLE_FLOOR_HAS_TABLES);
        }

        tableFloorRepository.delete(floor);
    }
}
