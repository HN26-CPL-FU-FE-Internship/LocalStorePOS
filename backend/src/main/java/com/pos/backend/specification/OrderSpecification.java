package com.pos.backend.specification;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import com.pos.backend.dto.request.Filter.OrderFilter;
import com.pos.backend.entity.Order;

import jakarta.persistence.criteria.Predicate;

public class OrderSpecification {

    public static Specification<Order> filter(OrderFilter filter) {
        return (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("orderedAt"), filter.getFromDate().atStartOfDay()));
            }

            if (filter.getToDate() != null) {
                predicates.add(
                        cb.lessThanOrEqualTo(root.get("orderedAt"), filter.getToDate().plusDays(1).atStartOfDay()));
            }

            if (filter.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }

            if (filter.getOrderNumber() != null) {
                predicates.add(
                        cb.like(cb.lower(root.get("orderNumber")), "%" + filter.getOrderNumber().toLowerCase() + "%"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
