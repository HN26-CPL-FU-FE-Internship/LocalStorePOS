package com.pos.backend.specification;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import com.pos.backend.dto.request.Filter.OrderFilter;
import com.pos.backend.entity.Customer;
import com.pos.backend.entity.Order;
import com.pos.backend.entity.RestaurantTable;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

public class OrderSpecification {

    /** Escape char used in every LIKE predicate so user input is matched literally. */
    private static final char ESCAPE_CHAR = '\\';

    public static Specification<Order> filter(OrderFilter filter) {
        return (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();
            Join<Order, RestaurantTable> tableJoin = null;
            Join<Order, Customer> customerJoin = null;

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

            if (filter.getKitchenStatus() != null) {
                predicates.add(cb.equal(root.get("kitchenStatus"), filter.getKitchenStatus()));
            }

            if (filter.getOrderNumber() != null) {
                predicates.add(
                        like(cb, root.get("orderNumber"), filter.getOrderNumber()));
            }

            if (filter.getTableNumber() != null) {
                if (tableJoin == null) {
                    tableJoin = root.join("table", JoinType.LEFT);
                }
                predicates.add(like(cb, tableJoin.get("tableNumber"), filter.getTableNumber()));
            }

            if (filter.getSearch() != null) {
                if (tableJoin == null) {
                    tableJoin = root.join("table", JoinType.LEFT);
                }
                if (customerJoin == null) {
                    customerJoin = root.join("customer", JoinType.LEFT);
                }
                String pattern = likePattern(filter.getSearch());
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("orderNumber")), pattern, ESCAPE_CHAR),
                        cb.like(cb.lower(root.get("tokenNo")), pattern, ESCAPE_CHAR),
                        cb.like(cb.lower(tableJoin.get("tableNumber")), pattern, ESCAPE_CHAR),
                        cb.like(cb.lower(customerJoin.get("name")), pattern, ESCAPE_CHAR)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Case-insensitive, wildcard-safe LIKE predicate for a single column.
     * Special LIKE characters in the user input are escaped so {@code %}/{@code _}
     * are matched literally.
     */
    private static Predicate like(jakarta.persistence.criteria.CriteriaBuilder cb,
            jakarta.persistence.criteria.Path<String> path, String value) {
        return cb.like(cb.lower(path), likePattern(value), ESCAPE_CHAR);
    }

    /** Escape LIKE wildcards and wrap the value in {@code %...%}. */
    private static String likePattern(String value) {
        String escaped = value.toLowerCase()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }
}
